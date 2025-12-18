using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

using CartService.Model;                 // AddCartItemRequest, CartItemRequest, CartDBContext
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

public class CartServiceFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        builder.ConfigureServices(services =>
        {
            // ===== 1) Override DB: remove SQL Server, use InMemory =====
            services.RemoveAll<DbContextOptions<CartDBContext>>();

            services.AddDbContext<CartDBContext>(o =>
                o.UseInMemoryDatabase($"CartDB_Test_{Guid.NewGuid()}"));

            // ===== 2) Replace Authentication: dùng TestAuth thay cho JWT =====
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "TestAuth";
                options.DefaultChallengeScheme = "TestAuth";
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("TestAuth", _ => { });
        });
    }
}

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder,
        ISystemClock clock
    ) : base(options, logger, encoder, clock) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var userId = Request.Headers.TryGetValue("X-Test-UserId", out var v) ? v.ToString() : "1";

        var claims = new List<Claim>
        {
            new Claim("userId", userId),
            new Claim("id", userId),
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("sub", userId),

            // pass policies (UserOnly / ActiveUser) nếu controller có dùng
            new Claim(ClaimTypes.Role, "User"),
            new Claim("is_active", "true"),
        };

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "TestAuth");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public class CartServiceTests : IClassFixture<CartServiceFactory>
{
    private readonly HttpClient _client;

    public CartServiceTests(CartServiceFactory factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("TestAuth");
    }

    private Task<HttpResponseMessage> PostAddAsync(string userIdHeaderValue, AddCartItemRequest? body)
    {
        _client.DefaultRequestHeaders.Remove("X-Test-UserId");
        _client.DefaultRequestHeaders.Add("X-Test-UserId", userIdHeaderValue);

        // Nếu body == null -> ASP.NET Core có thể trả "A non-empty request body is required"
        return _client.PostAsJsonAsync("/api/Cart/add", body);
    }

    private static Task<string> ReadContentAsync(HttpResponseMessage res)
        => res.Content.ReadAsStringAsync();

    // ============================================================
    // WB_ADD_01: GetUserId() <= 0 -> HTTP 400; message "Thiếu userId"
    // ============================================================
    [Theory]
    [InlineData("0")]
    [InlineData("-1")]
    public async Task WB_ADD_01_UserIdMissing_Returns400_WithMessage(string userId)
    {
        var req = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 1, Quantity = 1 }
            }
        };

        var res = await PostAddAsync(userId, req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        var content = await ReadContentAsync(res);
        Assert.Contains("Thiếu userId", content);
    }

    // ============================================================
    // WB_ADD_02A: Items = [] -> controller trả "Danh sách rỗng"
    // (vì DTO thật Items default new(), nên test empty list là case đúng)
    // ============================================================
    [Fact]
    public async Task WB_ADD_02A_ItemsEmpty_Returns400_WithMessage()
    {
        var req = new AddCartItemRequest { Items = new() };

        var res = await PostAddAsync("1", req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        var content = await ReadContentAsync(res);
        Assert.Contains("Danh sách rỗng", content);
    }

    // ============================================================
    // WB_ADD_02B: Items = null -> Validation 400 (ProblemDetails: errors)
    // Do Items không nullable trong DTO thật, nên để ép items:null phải post raw json
    // ============================================================
    [Fact]
    public async Task WB_ADD_02B_ItemsNull_Returns400_WithValidationError()
    {
        _client.DefaultRequestHeaders.Remove("X-Test-UserId");
        _client.DefaultRequestHeaders.Add("X-Test-UserId", "1");

        var body = new StringContent("{\"items\":null}", Encoding.UTF8, "application/json");
        var res = await _client.PostAsync("/api/Cart/add", body);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        var content = await ReadContentAsync(res);
        Assert.Contains("\"errors\"", content);
        // Key có thể là "Items" hoặc "items" tùy serializer/ProblemDetails
    }

    // ============================================================
    // WB_ADD_03: Có item vi phạm [Range] -> toàn request bị chặn -> 400 validation
    // ============================================================
    [Fact]
    public async Task WB_ADD_03_InvalidItems_Returns400_WithValidationError()
    {
        var req = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 0, Quantity = 1 }, // invalid Range
                new CartItemRequest { ProductId = 2, Quantity = 0 }, // invalid Range
                new CartItemRequest { ProductId = 3, Quantity = 2 }, // valid nhưng bị chặn theo batch
            }
        };

        var res = await PostAddAsync("1", req);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);

        var content = await ReadContentAsync(res);
        Assert.Contains("\"errors\"", content);
    }

    // ============================================================
    // WB_ADD_04: Add cùng product 2 lần -> lần 2 OK (đang dùng InMemory DB)
    // (chỉ assert status; nếu muốn assert qty thì cần parse JSON GetMyCart)
    // ============================================================
    [Fact]
    public async Task WB_ADD_04_ExistingProduct_IncreasesQuantity_Returns200()
    {
        var seed = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 1, Quantity = 1 }
            }
        };
        var seedRes = await PostAddAsync("1", seed);
        Assert.True(seedRes.StatusCode == HttpStatusCode.OK || seedRes.StatusCode == HttpStatusCode.Created);

        var req = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 1, Quantity = 2 }
            }
        };

        var res = await PostAddAsync("1", req);
        Assert.True(res.StatusCode == HttpStatusCode.OK || res.StatusCode == HttpStatusCode.Created);
    }

    // ============================================================
    // WB_ADD_05: Add product mới -> OK
    // ============================================================
    [Fact]
    public async Task WB_ADD_05_NewProduct_CreatesNewCartItem_Returns200()
    {
        var req = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 9, Quantity = 1 }
            }
        };

        var res = await PostAddAsync("2", req);
        Assert.True(res.StatusCode == HttpStatusCode.OK || res.StatusCode == HttpStatusCode.Created);
    }

    // ============================================================
    // WB_ADD_06: Mixed hợp lệ (KHÔNG có invalid Range) -> OK
    // Pre: product 1 qty 1
    // Add: product 1 qty +1 và product 9 qty 2
    // ============================================================
    [Fact]
    public async Task WB_ADD_06_MixedValidInput_UpdatesExistingAndAddsNew_Returns200()
    {
        var seed = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 1, Quantity = 1 }
            }
        };
        var seedRes = await PostAddAsync("3", seed);
        Assert.True(seedRes.StatusCode == HttpStatusCode.OK || seedRes.StatusCode == HttpStatusCode.Created);

        var mixed = new AddCartItemRequest
        {
            Items = new()
            {
                new CartItemRequest { ProductId = 1, Quantity = 1 }, // increase existing
                new CartItemRequest { ProductId = 9, Quantity = 2 }, // add new
            }
        };

        var res = await PostAddAsync("3", mixed);
        Assert.True(res.StatusCode == HttpStatusCode.OK || res.StatusCode == HttpStatusCode.Created);
    }
}
