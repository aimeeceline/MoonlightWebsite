namespace DiscountService.Repository
{
    public interface IDiscountRepository<T> where T : class
    {
        IEnumerable<T> GetAll();
        T GetById(int id);
        int Insert(T entity);

        int Update(T entity);

        int Delete(int id); // Xóa
    }
}
