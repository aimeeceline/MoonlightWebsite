using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using UserService.Model;

namespace UserService.Repository
{
    // Generic repository cho UserService
    public class GenericRepository<T> : IUserRepository<T> where T : class
    {
        // Cho phép class kế thừa truy cập trực tiếp Context/Entities
        protected readonly UserDBContext Context;
        protected readonly DbSet<T> Entities;

        public GenericRepository(UserDBContext context)
        {
            Context = context;
            Entities = Context.Set<T>();
        }

        // ===== SYNC (giữ nguyên) =====
        public IEnumerable<T> GetAll() => Entities.AsNoTracking().AsEnumerable();
        public T? GetById(int id) => Entities.Find(id);
        public int Insert(T entity) { Entities.Add(entity); return Context.SaveChanges(); }
        public int Update(T entity) { Entities.Update(entity); return Context.SaveChanges(); }
        public int Delete(int id)
        {
            var entity = GetById(id);
            if (entity is null) return 0;
            Entities.Remove(entity);
            return Context.SaveChanges();
        }

        // ===== ASYNC (bổ sung) =====
        public Task<List<T>> GetAllAsync(CancellationToken ct = default) =>
            Entities.AsNoTracking().ToListAsync(ct);

        public Task<T?> GetByIdAsync(int id, CancellationToken ct = default) =>
            Entities.FindAsync(new object?[] { id }, ct).AsTask();

        public async Task<int> InsertAsync(T entity, CancellationToken ct = default)
        {
            await Entities.AddAsync(entity, ct);
            return await Context.SaveChangesAsync(ct);
        }

        public Task<int> UpdateAsync(T entity, CancellationToken ct = default)
        {
            Entities.Update(entity);
            return Context.SaveChangesAsync(ct);
        }

        public async Task<int> DeleteAsync(int id, CancellationToken ct = default)
        {
            var entity = await GetByIdAsync(id, ct);
            if (entity is null) return 0;
            Entities.Remove(entity);
            return await Context.SaveChangesAsync(ct);
        }

        // ===== Query Helpers =====
        public IQueryable<T> Query() => Entities.AsQueryable();

        public Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
            Entities.AsNoTracking().FirstOrDefaultAsync(predicate, ct);

        public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default) =>
            Entities.AsNoTracking().AnyAsync(predicate, ct);
    }
}
