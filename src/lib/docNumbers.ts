export async function nextChangeOrderNumber(): Promise<string> {
  return 'CO-' + Date.now()
}

export async function nextEstimateNumber(): Promise<string> {
  return 'EST-' + Date.now()
}
