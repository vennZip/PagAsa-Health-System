import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollManager() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(!entry.isIntersecting && window.scrollY > 420);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return <><span ref={sentinelRef} className="scroll-sentinel" aria-hidden="true" /><button
    type="button"
    className={visible ? "return-to-top return-to-top--visible" : "return-to-top"}
    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    aria-label="Return to the top of the page"
    title="Return to top"
  >
    <span aria-hidden="true">↑</span>
  </button></>;
}
