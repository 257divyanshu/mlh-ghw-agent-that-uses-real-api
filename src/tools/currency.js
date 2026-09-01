export async function convertCurrency(amount, from, to) {
  console.log(
    `\n💱 Getting real exchange rate: ${amount} ${from} → ${to}...`
  );

  const base = from.toUpperCase();
  const quote = to.toUpperCase();

  const url =
    `https://api.frankfurter.dev/v2/rate/` +
    `${encodeURIComponent(base)}/` +
    `${encodeURIComponent(quote)}`;

  const response = await fetch(url);

  if (!response.ok) {
    return {
      error: `Could not convert ${base} to ${quote}.`,
    };
  }

  const data = await response.json();

  return {
    amount,
    from: base,
    to: quote,
    rate: data.rate,

    // Calculate the converted amount using the rate returned by the API.
    convertedAmount: Number(
      (amount * data.rate).toFixed(2)
    ),

    date: data.date,
  };
}