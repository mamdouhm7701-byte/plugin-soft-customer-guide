export function whatsappLink(text: string, mobile = false) {
  return (
    (mobile ? 'https://wa.me/?text=' : 'https://web.whatsapp.com/send?text=') +
    encodeURIComponent(text)
  );
}
