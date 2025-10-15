public interface IUserRepository<T> where T : class
{
    IEnumerable<T> GetAll();
    T? GetById(int id);   // đổi T -> T?
    int Insert(T entity);
    int Update(T entity);
    int Delete(int id);
}
