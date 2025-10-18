using Microsoft.EntityFrameworkCore;
using UserService.Model;

namespace UserService.Repository
{
    // Repository đặc thù cho User với helper xử lý IsActive/Username/Email
    public class UserRepository : GenericRepository<User>
    {
        public UserRepository(UserDBContext context) : base(context) { }

        // ==== Helper chuyên biệt ====

        public Task<User?> GetByUsernameAsync(string username, CancellationToken ct = default) =>
            Context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username != null && u.Username.ToLower() == username.ToLower(), ct);

        public Task<bool> UsernameExistsAsync(string username, int? exceptUserId = null, CancellationToken ct = default)
        {
            var q = Context.Users.AsNoTracking()
                    .Where(u => u.Username != null && u.Username.ToLower() == username.ToLower());
            if (exceptUserId.HasValue) q = q.Where(u => u.UserId != exceptUserId.Value);
            return q.AnyAsync(ct);
        }

        public Task<bool> EmailExistsAsync(string email, int? exceptUserId = null, CancellationToken ct = default)
        {
            var q = Context.Users.AsNoTracking()
                    .Where(u => u.Email != null && u.Email.ToLower() == email.ToLower());
            if (exceptUserId.HasValue) q = q.Where(u => u.UserId != exceptUserId.Value);
            return q.AnyAsync(ct);
        }

        public async Task<int> ToggleActiveAsync(int userId, bool active, CancellationToken ct = default)
        {
            var user = await Context.Users.FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user is null) return 0;
            user.IsActive = active;                 // cờ mới theo ERD Users
            return await Context.SaveChangesAsync(ct);
        }

        public Task<List<User>> GetUsersAsync(bool onlyActive = false, CancellationToken ct = default)
        {
            var q = Context.Users.AsNoTracking().Where(u => u.TypeUser != null && u.TypeUser.ToLower() == "user");
            if (onlyActive) q = q.Where(u => u.IsActive);
            return q.OrderByDescending(u => u.UserId).ToListAsync(ct);
        }
    }
}
