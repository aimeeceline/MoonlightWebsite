using System.Threading.Tasks;

namespace OrdersService.Services
{
    public class EmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            // TODO: tích hợp SMTP/SendGrid sau.
            // Tạm thời cho chạy compile thành công:
            return Task.CompletedTask;
        }
    }
}
