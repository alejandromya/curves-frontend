import React from "react";

type InputProps = {
  title: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value: number; // <- agregarlo aquí
};

export const Input: React.FC<InputProps> = ({ title, onChange, value }) => {
  return (
    <label>
      {title}
      <input type="number" value={value} onChange={onChange} />
    </label>
  );
};
