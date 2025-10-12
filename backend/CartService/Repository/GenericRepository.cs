using CartService.Model;
using Microsoft.EntityFrameworkCore;

namespace CartService.Repository
{
    // Repo generic dùng DI để nhận DbContext
    public class GenericRepository<T> : ICartRepository<T> where T : class
    {
        protected readonly CartDBContext _context;
        protected readonly DbSet<T> _entities;

        public GenericRepository(CartDBContext context)
        {
            _context = context;
            _entities = context.Set<T>();
        }

        public IEnumerable<T> GetAll()
        {
            // đọc nhẹ: AsNoTracking để giảm overhead
            return _entities.AsNoTracking().AsEnumerable();
        }

        public T GetById(int id) => _entities.Find(id)!;

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
