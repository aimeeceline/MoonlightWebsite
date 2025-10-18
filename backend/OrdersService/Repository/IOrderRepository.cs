namespace OrdersService.Repository
{
    public interface IOrderRepository<T> where T : class
    {
        // ===== SYNC (giữ nguyên để không vỡ code cũ) =====
        IEnumerable<T> GetAll();
        T GetById(int id);
        int Insert(T entity);
        int Update(T entity);
        int Delete(int id);

        // ===== ASYNC (bổ sung) =====
        Task<List<T>> GetAllAsync(CancellationToken ct = default);
        Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
        Task<int> InsertAsync(T entity, CancellationToken ct = default);
        Task<int> UpdateAsync(T entity, CancellationToken ct = default);
        Task<int> DeleteAsync(int id, CancellationToken ct = default);

        // ===== Query helpers =====
        IQueryable<T> Query();
        Task<T?> FirstOrDefaultAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken ct = default);
        Task<bool> AnyAsync(System.Linq.Expressions.Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    }
}
