import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'site_visits';

const VisitorCounter: React.FC = () => {
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    // Получаем текущее количество посещений из localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    let count = stored ? parseInt(stored, 10) : 0;
    // Увеличиваем счётчик при каждом монтировании компонента (т.е. при загрузке страницы)
    count += 1;
    localStorage.setItem(STORAGE_KEY, count.toString());
    setVisits(count);
  }, []);

  return (
    <footer className="w-full py-4 mt-8 text-center text-[#b0c8e0] text-xs md:text-sm border-t border-white/10">
      <span>👁️ Посещений: {visits}</span>
    </footer>
  );
};

export default VisitorCounter;