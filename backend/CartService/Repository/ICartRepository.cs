using System.Linq.Expressions;

namespace CartService.Repository
{
    public interface ICartRepository<T> where T : class
    {
        // Sync
        IEnumerable<T> GetAll();
        T? GetById(int id);
        int Insert(T entity);
        int Update(T entity);
        int Delete(int id);

        // Async mở rộng
        Task<List<T>> GetAllAsync(CancellationToken ct = default);
        Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<int> InsertAsync(T entity, CancellationToken ct = default);
        Task<int> UpdateAsync(T entity, CancellationToken ct = default);
        Task<int> DeleteAsync(int id, CancellationToken ct = default);

        IQueryable<T> Query();
        Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
        Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    }
}
