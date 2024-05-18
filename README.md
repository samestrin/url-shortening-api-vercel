# url-shortening-api-vercel

[![Star on GitHub](https://img.shields.io/github/stars/samestrin/url-shortening-api-vercel?style=social)](https://github.com/samestrin/url-shortening-api-vercel/stargazers)[![Fork on GitHub](https://img.shields.io/github/forks/samestrin/url-shortening-api-vercel?style=social)](https://github.com/samestrin/url-shortening-api-vercel/network/members)[![Watch on GitHub](https://img.shields.io/github/watchers/samestrin/url-shortening-api-vercel?style=social)](https://github.com/samestrin/url-shortening-api-vercel/watchers)

![Version 0.0.1](https://img.shields.io/badge/Version-0.0.1-blue)[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)[![Built with Node.js](https://img.shields.io/badge/Built%20with-Node.js-green)](https://nodejs.org/)

url-shortening-api-vercel is a URL shortener service. It is a serverless application that provides URL shortening and retrieval functionalities. Utilizing the Vercel infrastructure - Vercel Functions, Vercel KV (Redis), and Vercel Postgres, the application offers a high performance, efficient and scalable solution for creating, serving, and tracking short URLs that redirect to the original, longer URLs.

### Why Vercel Infrastructure

This project now uses Vercel because they are a single provider for all project infrastructure needs, including Vercel Functions, Vercel KV (Redis), and Vercel Postgres. Migrating to Vercel has reduced latency caused by historical Netlify/Supabase interactions and allowed for using Vercel KV (Redis) as a caching layer.

Please note, moving from Netlify Edge Functions to Vercel Functions reduces the number of function executions to 100k/month. If you need more executions, the [url-shortening-api-netlify-edge-supabase](Netlify Edge version) of this API may still be a better choice.

_This replaces the legacy [url-shortening-api-netlify-edge-supabase](https://github.com/samestrin/url-shortening-api-netlify-edge-supabase) project due to a number of performance improvements._

## Features

- **URL Shortening**: Convert long URLs into short, manageable links.
- **URL Validation**: Ensures that only valid URLs with proper protocols are processed.
- **Redirection**: Automatically redirect users from the short URL to the original long URL.
- **Latest Links Retrieval**: Fetch the most recently shortened URLs.
- **URL Count**: Retrieve the total number of URLs shortened.
- **API Version Information**: Obtain the current version of the API.
- **CORS Support**: Handles Cross-Origin Resource Sharing to enable API access from different domains.
- **Error Handling**: Graceful error responses for various error scenarios.

## Dependencies

- **Node.js**: JavaScript runtime environment
- **Vercel**: Hosting platform for serverless functions
- **PostgreSQL (Vercel Postgres)**: Relational database for storing URL data
- **Redis (Vercel KV)**: Key-Value store for caching
- **formidable**: Library for parsing form data
- **valid-url**: Utility for URL validation
- **dotenv**: Environment variable management

## Installing Node.js

Before installing, ensure you have Node.js and npm (Node Package Manager) installed on your system. You can download and install Node.js from [Node.js official website](https://nodejs.org/).

## Installing url-shortening-api-vercel

1.  **Clone the Repository**

```bash
git clone https://github.com/samestrin/url-shortening-api-vercel.git
cd url-shortening-api-vercel
```

2.  **Install Dependencies**

```bash
npm install
```

3.  **Set Up PostgreSQL Database**

Create your Postgres database.

Run the SQL script to create necessary tables and insert initial data using the Vercel Storage interface.

4.  **Set Up KV (Redis) **

Create your KV database.

5.  **Configure Environment Variables**

Create a `**.env**` file in the root directory and add the following variables:

```bash
POSTGRES_URL=your_postgres_connection_string
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
URLSHORT_URL_BASE=your_base_url (Example: http://frwrd.ing/)
URLSHORT_TRACK_CLICKS=true_or_false
URLSHORT_RESOLVE_HOSTNAME=true_or_false URLSHORT_DEFAULT_IP_ADDRESS_ID=default_ip_address_id URLSHORT_DEFAULT_HOSTNAME_ID=default_hostname_id
URLSHORT_DEFAULT_USER_ID=default_user_id
```

6.  **Deploy to Vercel**

```bash
vercel deploy
```

## Endpoints

### Shorten URL

**Endpoint:** `/shorten` **Method:** POST

Shorten a long URL and return the shortened URL.

- `url`: The URL to be shortened.

#### **Example Usage**

Use a tool like Postman or curl to make a request:

```bash
curl -X POST \
  https://localhost/shorten \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'url=https://www.google.com'
```

The server responds with:

```bash
{"shortUrl":"lqywv6P"}
```

### Forward URL

**Endpoint:** `/[shortId]` **Method:** GET

Based on shortened URL, e.g. `/lqywv6P` HTTP 301 forward to a long url.

This endpoint is accessed by navigating directly to the shortened URL.

#### **Example Usage**

Use curl to make a request:

```bash
curl http://localhost/[shortId]
```

### Retrieve Latest Shortened Links

**Endpoint:** `/latest` **Method:** GET

Retrieve the latest URLs shortened.

This endpoint is accessed by navigating directly to /latest.

#### **Example Usage**

Use curl to make a request:

```bash
curl http://localhost/latest
```

### Retrieve Count

**Endpoint:** `/count` **Method:** GET

Retrieve the number of URLs shortened.

This endpoint is accessed by navigating directly to /count.

#### **Example Usage**

Use curl to make a request:

```bash
curl http://localhost/count
```

### Retrieve Version

**Endpoint:** `/version` **Method:** GET

Retrieve the current version of the API.

This endpoint is accessed by navigating directly to /version.

#### **Example Usage**

Use curl to make a request:

```bash
curl http://localhost/version
```

The server responds with:

```bash
{
    "name": "url-shortening-api-vercel",
    "version": "0.0.1",
    "description": "url-shortening-api-vercel is a URL shortener service using the Vercel infrastructure - Vercel Functions, Vercel KV (Redis), and Vercel Postgres.",
    "author": "Sam Estrin",
    "homepage": "https://github.com/samestrin/url-shortening-api-vercel#readme"
}
```

## CORS

The server responds with appropriate CORS headers such as Access-Control-Allow-Origin.

## Error Handling

The API handles errors gracefully and returns appropriate error responses:

- **400 Bad Request**: Invalid request parameters.
- **404 Not Found**: Resource not found.
- **405 Method Not Allowed**: Invalid request method (not GET or POST).
- **500 Internal Server Error**: Unexpected server error.

## Contribute

Contributions to this project are welcome. Please fork the repository and submit a pull request with your changes or improvements.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Share

[![Twitter](https://img.shields.io/badge/X-Tweet-blue)](https://twitter.com/intent/tweet?text=Check%20out%20this%20awesome%20project!&url=https://github.com/samestrin/url-shortening-api-vercel) [![Facebook](https://img.shields.io/badge/Facebook-Share-blue)](https://www.facebook.com/sharer/sharer.php?u=https://github.com/samestrin/url-shortening-api-vercel) [![LinkedIn](https://img.shields.io/badge/LinkedIn-Share-blue)](https://www.linkedin.com/sharing/share-offsite/?url=https://github.com/samestrin/url-shortening-api-vercel)
