export const formatRupiah = (value: string | number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

export const formatDate = (value: string | null | undefined, formatOptions?: Intl.DateTimeFormatOptions) => {
  if (!value) return "-";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  };

  return new Date(value).toLocaleDateString("id-ID", formatOptions || defaultOptions);
};
