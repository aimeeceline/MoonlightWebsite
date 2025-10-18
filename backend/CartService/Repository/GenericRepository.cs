using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using CartService.Model;

namespace CartService.Repository
{
    public class GenericRepository<T> : ICartRepository<T> where T : class
    {
        protected readonly CartDBContext _context;
        protected readonly DbSet<T> _entities;

        public GenericRepository(CartDBContext context)
        {
            _context = context;
            _entities = _context.Set<T>();
        }

        // ===== Sync (giữ nguyên) =====
        public IEnumerable<T> GetAll() => _entities.AsNoTracking().AsEnumerable();
        public virtual T? GetById(int id) => _entities.Find(id);

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
            if (entity is null) return 0;
            _entities.Remove(entity);
            return _context.SaveChanges();
        }

        // ===== Async mở rộng =====
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
            var entity = await GetByIdAsync(id, ct);
            if (entity is null) return 0;
            _entities.Remove(entity);
            return await _context.SaveChangesAsync(ct);
        }

        // ===== Helpers =====
        public IQueryable<T> Query() => _entities.AsQueryable();
        public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> p, CancellationToken ct = default) =>
            _entities.AsNoTracking().FirstOrDefaultAsync(p, ct);
        public Task<bool> AnyAsync(Expression<Func<T, bool>> p, CancellationToken ct = default) =>
            _entities.AsNoTracking().AnyAsync(p, ct);
    }
}
