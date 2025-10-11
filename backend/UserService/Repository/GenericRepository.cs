using Microsoft.EntityFrameworkCore;
using UserService.Model;

namespace UserService.Repository
{
    public class GenericRepository<T> : IUserRepository<T> where T : class
    {
        private readonly UserDBContext _context;
        private readonly DbSet<T> _entities;

        public GenericRepository()
        {
            _context = new UserDBContext();
            _entities = _context.Set<T>();
        }
        public GenericRepository(UserDBContext context)
        {
            _context = context;
            _entities = context.Set<T>();
        }

        public IEnumerable<T> GetAll()
        {
            return _entities.AsEnumerable();
        }

        public T GetById(int id)
        {
            return _entities.Find(id);
        }
        public int Insert(T entity)
        {
            _entities.Add(entity);
            return _context.SaveChanges();
        }
        public int Update(T entity)
        {
            _entities.Update(entity);
            return _context.SaveChanges();
        }
        public int Delete(int id)
        {
            var entity = GetById(id);
            _entities.Remove(entity);
            return _context.SaveChanges();
        }
    }
}
