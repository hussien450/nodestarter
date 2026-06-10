import axios from "axios";
import express from "express";

const app = express();

app.use(express.json());

async function providerA() {
  const { data } = await axios.get(
    "https://68f9dbbfef8b2e621e7dbe17.mockapi.io/people",
  );

  console.log(data);
  return data;
}

async function providerB() {
  const { data } = await axios.get(
    "https://68f9dbbfef8b2e621e7dbe17.mockapi.io/MovieGenres",
  );
  console.log(data);
  return data;
}

app.get("/", async (req, res) => {
  // pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const start = (page - 1) * limit;
  const end = start + limit;

  const exRates = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.75,
    EGP: 0.019,
  };

  const converCurrency = exRates[req.query.currency] || 1;

  let combinedData = [];

  let warnings = [];

  const results = await Promise.allSettled([providerA(), providerB()]);

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const value = result.value.map((item) => ({
        id: item.id,
        name: item.prodName || item.productName,
        price: (item.price || item.price) * converCurrency,
      }));
      combinedData.push(...value);
    } else {
      warnings.push(`Provider ${index + 1} failed: ${result.reason}`);
      return res.status(500).json({ error: warnings });
    }
  });

  const search = (req.query.search || "").toString().trim().toLowerCase();

  if (search) {
    combinedData = combinedData.filter(
      (item) =>
        item.name && item.name.toLowerCase().includes(search.toLowerCase()),
    );
  }

  res.status(200).json({
    page,
    limit,
    data: combinedData.slice(start, end),
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(3000, () => {
  console.log("server is running on port 3000");
});
