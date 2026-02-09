const http = require('http')
const https = require('https')
const zlib = require('zlib')
const { URL } = require('url')

/**
 * Proxy middleware for the webpack dev server.
 *
 * When the app runs as a regular website (LOCAL platform) instead of a Chrome
 * extension, iframes that load external URLs are blocked by X-Frame-Options
 * and Content-Security-Policy response headers.
 *
 * This proxy strips those headers so the pages can be displayed inside iframes.
 * It also injects a <base> tag into HTML responses so that relative URLs in
 * the proxied page still resolve to the original domain.
 */
module.exports = function(app) {
  app.use('/proxy', (req, res) => {
    const targetUrl = req.query.url

    if (!targetUrl) {
      return res.status(400).json({ error: 'Missing "url" query parameter' })
    }

    let parsedUrl
    try {
      parsedUrl = new URL(targetUrl)
    } catch (_e) {
      return res.status(400).json({ error: 'Invalid URL' })
    }

    const client = parsedUrl.protocol === 'https:' ? https : http

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: {
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          req.headers['accept'] ||
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Host: parsedUrl.host,
        Referer: targetUrl,
      },
    }

    const proxyReq = client.request(options, proxyRes => {
      // Follow redirects through the proxy
      if (
        [301, 302, 303, 307, 308].includes(proxyRes.statusCode) &&
        proxyRes.headers['location']
      ) {
        const redirectUrl = new URL(proxyRes.headers['location'], targetUrl)
          .href
        return res.redirect(
          proxyRes.statusCode === 301 ? 301 : 302,
          `/proxy?url=${encodeURIComponent(redirectUrl)}`
        )
      }

      // Build response headers, stripping iframe-blocking ones
      const blockedHeaders = [
        'x-frame-options',
        'content-security-policy',
        'content-security-policy-report-only',
        'frame-options',
      ]

      const responseHeaders = {}
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (!blockedHeaders.includes(key.toLowerCase())) {
          responseHeaders[key] = value
        }
      }

      // Allow cross-origin access
      responseHeaders['access-control-allow-origin'] = '*'

      const contentType = (proxyRes.headers['content-type'] || '').toLowerCase()

      if (contentType.includes('text/html')) {
        // For HTML: buffer the response, decompress if needed, inject <base> tag
        delete responseHeaders['content-encoding']
        delete responseHeaders['content-length']
        delete responseHeaders['transfer-encoding']

        const encoding = proxyRes.headers['content-encoding']
        let stream = proxyRes

        if (encoding === 'gzip') {
          stream = proxyRes.pipe(zlib.createGunzip())
        } else if (encoding === 'deflate') {
          stream = proxyRes.pipe(zlib.createInflate())
        } else if (encoding === 'br') {
          stream = proxyRes.pipe(zlib.createBrotliDecompress())
        }

        const chunks = []
        stream.on('data', chunk => chunks.push(chunk))
        stream.on('end', () => {
          let body = Buffer.concat(chunks).toString('utf-8')

          // Inject <base> tag so relative URLs resolve to the original domain
          const baseTag = `<base href="${targetUrl}">`
          if (/<head[^>]*>/i.test(body)) {
            body = body.replace(/<head([^>]*)>/i, `<head$1>\n${baseTag}`)
          } else if (/<html[^>]*>/i.test(body)) {
            body = body.replace(
              /<html([^>]*)>/i,
              `<html$1>\n<head>${baseTag}</head>`
            )
          } else {
            body = `${baseTag}\n${body}`
          }

          res.writeHead(proxyRes.statusCode || 200, responseHeaders)
          res.end(body)
        })
        stream.on('error', () => {
          res.status(500).json({ error: 'Decompression error' })
        })
      } else {
        // Non-HTML: pipe directly with stripped headers
        res.writeHead(proxyRes.statusCode || 200, responseHeaders)
        proxyRes.pipe(res)
      }
    })

    proxyReq.on('error', err => {
      res.status(502).json({ error: `Proxy error: ${err.message}` })
    })

    proxyReq.setTimeout(30000, () => {
      proxyReq.destroy()
      res.status(504).json({ error: 'Proxy request timeout' })
    })

    proxyReq.end()
  })
}
