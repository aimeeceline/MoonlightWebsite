using Microsoft.EntityFrameworkCore;
using PaymentService.Model;
using System;

namespace PaymentService.Repository
{
    public class PaymentRepository: GenericRepository<Payment>
    {
        public Payment? GetPendingPaymentByUserId(int userId)
        {
            using (var context = new PaymentDBContext())
            {
                return context.Payments
                              .Where(p => p.UserId == userId && (p.Status == "Pending" || p.Status == "Completed"))
                              .OrderByDescending(p => p.PaymentDate)  // Lấy bản ghi mới nhất
                              .FirstOrDefault();
            }
        }
        public Payment? GetLatestPaymentByUserId(int userId)
        {
            using (var context = new PaymentDBContext())
            {
                return context.Payments
                           .Where(p => p.UserId == userId)
                           .OrderByDescending(p => p.PaymentDate)
                           .FirstOrDefault();
            }
            
        }
    }
}
