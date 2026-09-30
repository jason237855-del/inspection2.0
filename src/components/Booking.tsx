import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "./ui/button";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Booking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section id="booking" className="py-24 lg:py-32 bg-background" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground tracking-tight">
            預約檢測服務
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            填寫基本資料，我們將在 24 小時內與您聯繫確認檢測時間。
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Button
              asChild
              size="default"
              className="rounded-full smooth-hover text-[13px] tracking-wider font-normal px-8 py-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link to="/booking">
                <CalendarDays className="mr-2 h-4 w-4" />
                立即預約驗屋
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Booking;
