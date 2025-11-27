import React from "react";

type ButtonProps = {
  title: string;
  onClick?: () => void;
  className?: string; // <- agregarlo aquí
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onClick,
  className,
}) => {
  return (
    <button className={className} onClick={onClick}>
      {title}
    </button>
  );
};
