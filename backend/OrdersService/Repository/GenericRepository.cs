using Microsoft.EntityFrameworkCore;
using OrdersService.Model;

namespace OrdersService.Repository
{
    public class GenericRepository<T> : IOrderRepository<T> where T : class
    {
        private readonly OrderDBContext _context;
        private readonly DbSet<T> _entities;

        public GenericRepository()
        {
            _context = new OrderDBContext();
            _entities = _context.Set<T>();
        }
        public GenericRepository(OrderDBContext context)
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
