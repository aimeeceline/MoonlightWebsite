using Microsoft.EntityFrameworkCore;
using ProductService.Model;

namespace ProductService.Repository
{
    public class GenericRepository<T> : IProductRepository<T> where T : class
    {
        private readonly ProductDBContext _context;
        private readonly DbSet<T> _entities;

        public GenericRepository()
        {
            _context = new ProductDBContext();
            _entities = _context.Set<T>();
        }
        public GenericRepository(ProductDBContext context)
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
