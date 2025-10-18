using System.Threading.Tasks;

namespace OrdersService.Services
{
    public class EmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string htmlBody)
        {
            // TODO: tích hợp SMTP/SendGrid sau.
            return Task.CompletedTask;
        }
    }
}
