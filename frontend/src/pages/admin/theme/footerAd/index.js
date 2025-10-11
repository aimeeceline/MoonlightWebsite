import { memo } from "react";
import "./style.scss"

const Footer = () => {
    return <footer class="footer px-4">
        <div><a href="https://coreui.io"></a><a href="https://coreui.io/product/bootstrap-dashboard-template/">Bae BaBeauty</a> © 2025</div>
        <div class="ms-auto">Powered by&nbsp;<a href="https://coreui.io/docs/">CoreUI PRO UI Components</a></div>
  </footer>
};

export default memo(Footer);
