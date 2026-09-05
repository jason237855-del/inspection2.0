import logoWhite from "@/assets/logo-mark-white.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 lg:gap-16">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img
              src={logoWhite}
              alt="診斷室驗屋 Home Inspection & Diagnostics 標誌"
              className="h-8 w-auto"
              width={38}
              height={32}
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-[0.08em] leading-relaxed">
                診斷室驗屋
              </span>
              <span className="text-[10px] uppercase tracking-[0.14em] leading-relaxed opacity-70">
                Home Inspection &amp; Diagnostics
              </span>
            </div>
          </div>

          {/* Service areas */}
          <div className="text-left md:text-right">
            <h3 className="text-sm font-semibold tracking-[0.08em] leading-relaxed mb-2 opacity-90">
              服務地區
            </h3>
            <div className="flex flex-wrap md:justify-end gap-x-6 gap-y-2 text-sm font-light leading-relaxed tracking-wide text-background/70">
              <span>台北</span>
              <span>新北</span>
              <span>桃園</span>
              <span>新竹</span>
              <span>基隆</span>
              <span>宜蘭</span>
            </div>
          </div>
        </div>

        <p className="text-background/70 text-sm font-light leading-relaxed tracking-wide mt-4 max-w-md">
          交屋前，多一次仔細；入住後，多一份安心。
        </p>

        <div className="border-t border-background/15 pt-8 mt-14 text-center text-background/50 text-xs font-light tracking-wide">
          <p>&copy; 2026 診斷室驗屋 Home Inspection &amp; Diagnostics. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
