
namespace PaymentService.Model
{
    public class PaymentSettings
    {
        // Cấu hình VietQR/SEPay thật (khi dùng production)
        public string? BankCode { get; set; }         // vd: 970436 (VCB), 970407 (TCB)...
        public string? AccountNumber { get; set; }    // số tài khoản nhận tiền
        public string? SepayApiBase { get; set; }     // vd: https://my.sepay.vn
        public string? SepayApiToken { get; set; }    // token của SEPay
        public string? InternalSecret { get; set; } = "devsecret";

        public int QrExpireSeconds { get; set; } = 120;

        // ---- MOCK DEMO (để quét QR rồi bấm "Xác nhận" cho completed) ----
        public bool UseMockBank { get; set; } = true;            // bật/tắt mock
        public string MockSecret { get; set; } = "devsecret";    // secret chống spam
        public string? PublicBaseUrl { get; set; }               // URL public (ngrok/domain). Nếu null sẽ fallback localhost.
    }
}
