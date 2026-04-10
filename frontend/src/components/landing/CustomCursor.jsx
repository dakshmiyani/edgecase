import React, { useEffect, useRef } from 'react';

const CustomCursor = () => {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const onMouseMove = (e) => {
      const { clientX, clientY } = e;
      
      if (dotRef.current) {
        dotRef.current.style.left = `${clientX - 3.5}px`;
        dotRef.current.style.top = `${clientY - 3.5}px`;
      }
      
      if (ringRef.current) {
        ringRef.current.style.left = `${clientX - 17}px`;
        ringRef.current.style.top = `${clientY - 17}px`;
      }
    };

    const onMouseEnter = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = 'scale(1.9)';
        ringRef.current.style.borderColor = 'rgba(159, 95, 253, 0.8)';
      }
    };

    const onMouseLeave = () => {
      if (ringRef.current) {
        ringRef.current.style.transform = 'scale(1)';
        ringRef.current.style.borderColor = 'rgba(159, 95, 253, 0.45)';
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    const interactiveElements = document.querySelectorAll('button, a, .mag-btn');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
    };
  }, []);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: '#9f5ffd',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9999,
          mixBlendMode: 'screen',
        }}
      />
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          width: '34px',
          height: '34px',
          border: '1.5px solid rgba(159, 95, 253, 0.45)',
          borderRadius: '50%',
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'all 0.16s ease',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};

export default CustomCursor;
