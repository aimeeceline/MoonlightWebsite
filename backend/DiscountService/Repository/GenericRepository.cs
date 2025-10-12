using DiscountService.Model;
using DiscountService.Repository;
using Microsoft.EntityFrameworkCore;

namespace DiscountService.Repository
{
    public class GenericRepository<T> : IDiscountRepository<T> where T : class
    {
        private readonly DiscountDBContext _context;
        private readonly DbSet<T> _entities;

        public GenericRepository()
        {
            _context = new DiscountDBContext();
            _entities = _context.Set<T>();
        }
        public GenericRepository(DiscountDBContext context)
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
