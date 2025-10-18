using Microsoft.EntityFrameworkCore;
using OrdersService.Model;

namespace OrdersService.Repository
{
    public class GenericRepository<T> : IOrderRepository<T> where T : class
    {
        protected readonly OrderDBContext _context;
        protected readonly DbSet<T> _entities;

        // Giữ nguyên ctor cũ để không vỡ DI nếu nơi khác dùng
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

        // ===== SYNC =====
        public IEnumerable<T> GetAll() => _entities.AsNoTracking().AsEnumerable();
        public T GetById(int id) => _entities.Find(id)!;
        public int Insert(T entity) { _entities.Add(entity); return _context.SaveChanges(); }
        public int Update(T entity) { _entities.Update(entity); return _context.SaveChanges(); }
        public int Delete(int id)
        {
            var e = GetById(id);
            _entities.Remove(e);
            return _context.SaveChanges();
        }

        // ===== ASYNC =====
        public Task<List<T>> GetAllAsync(CancellationToken ct = default) =>
            _entities.AsNoTracking().ToListAsync(ct);

        public Task<T?> GetByIdAsync(int id, CancellationToken ct = default) =>
            _entities.FindAsync(new object[] { id }, ct).AsTask();

        public async Task<int> InsertAsync(T entity, CancellationToken ct = default)
        {
            await _entities.AddAsync(entity, ct);
            return await _context.SaveChangesAsync(ct);
        }

        public Task<int> UpdateAsync(T entity, CancellationToken ct = default)
        {
            _entities.Update(entity);
            return _context.SaveChangesAsync(ct);
        }

        public async Task<int> DeleteAsync(int id, CancellationToken ct = default)
        {
            var e = await GetByIdAsync(id, ct);
            if (e is null) return 0;
            _entities.Remove(e);
            return await _context.SaveChangesAsync(ct);
        }

        // ===== Query helpers =====
        public IQueryable<T> Query() => _entities.AsQueryable();

        public Task<T?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<T, bool>> p, CancellationToken ct = default) =>
            _entities.AsNoTracking().FirstOrDefaultAsync(p, ct);

        public Task<bool> AnyAsync(System.Linq.Expressions.Expression<Func<T, bool>> p, CancellationToken ct = default) =>
            _entities.AsNoTracking().AnyAsync(p, ct);
    }
}
