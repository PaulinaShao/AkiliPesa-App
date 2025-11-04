
// TODO: Implement Weather API adapter
// This would be a simple adapter to fetch data from a weather API.

export async function run(payload: any, options: any, secrets: any) {
  const { WEATHER_API_KEY } = secrets;
  
  console.log("Calling Weather adapter with payload:", payload);

  // Placeholder
  const weatherData = { temp: 72, condition: "Sunny" };
  
  return {
    stream: JSON.stringify(weatherData),
    costEstimate: 0.001,
  };
}
