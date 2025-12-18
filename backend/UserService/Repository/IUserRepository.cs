using System.Linq.Expressions;

public interface IUserRepository<T> where T : class
{
    // ====== Các hàm SYNC cũ (giữ nguyên để không vỡ code) ======
    IEnumerable<T> GetAll();
    T? GetById(int id);
    int Insert(T entity);
    int Update(T entity);
    int Delete(int id);

    // ====== BỔ SUNG: phiên bản ASYNC & tiện ích truy vấn ======
    Task<List<T>> GetAllAsync(CancellationToken ct = default);
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<int> InsertAsync(T entity, CancellationToken ct = default);
    Task<int> UpdateAsync(T entity, CancellationToken ct = default);
    Task<int> DeleteAsync(int id, CancellationToken ct = default);

    // Query tiện lợi (không thực thi) để controller có thể .Where/.Select
    IQueryable<T> Query();

    // Tìm nhanh theo điều kiện
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken ct = default);
}
