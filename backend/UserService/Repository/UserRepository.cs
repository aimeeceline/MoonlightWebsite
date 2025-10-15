using UserService.Model;

namespace UserService.Repository
{
    public class UserRepository : GenericRepository<User>
    {
        public UserRepository(UserDBContext context) : base(context) { }
    }
}
