// Vercel Serverless Function: /api/scan
// Proxies PDP scan requests to Anthropic using Node's built-in https module.
// Set ANTHROPIC_API_KEY in Vercel → Project Settings → Environment Variables.

const https = require("https");

function anthropicRequest(apiKey, body) {
  return new Promise((resolve, reject) => {
      const data = JSON.stringify(body);
          const options = {
                hostname: "api.anthropic.com",
                      path: "/v1/messages",
                            method: "POST",
                                  headers: {
                                          "Content-Type": "application/json",
                                                  "Content-Length": Buffer.byteLength(data),
                                                          "x-api-key": apiKey,
                                                                  "anthropic-version": "2023-06-01",
                                                                        },
                                                                            };
                                                                                const req = https.request(options, (res) => {
                                                                                      let raw = "";
                                                                                            res.on("data", (chunk) => { raw += chunk; });
                                                                                                  res.on("end", () => resolve({ status: res.statusCode, body: raw }));
                                                                                                      });
                                                                                                          req.on("error", reject);
                                                                                                              req.setTimeout(55000, () => { req.destroy(new Error("Timed out waiting for Anthropic (55s)")); });
                                                                                                                  req.write(data);
                                                                                                                      req.end();
                                                                                                                        });
                                                                                                                        }
                                                                                                                        
                                                                                                                        module.exports = async function handler(req, res) {
                                                                                                                          res.setHeader("Access-Control-Allow-Origin", "*");
                                                                                                                            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
                                                                                                                              res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
                                                                                                                              
                                                                                                                                if (req.method === "OPTIONS") { res.status(204).end(); return; }
                                                                                                                                  if (req.method !== "POST") {
                                                                                                                                      res.status(405).json({ error: { type: "method_not_allowed", message: "Use POST." } });
                                                                                                                                          return;
                                                                                                                                            }
                                                                                                                                            
                                                                                                                                              const apiKey = process.env.ANTHROPIC_API_KEY;
                                                                                                                                                if (!apiKey) {
                                                                                                                                                    res.status(500).json({ error: { type: "config_error", message: "ANTHROPIC_API_KEY not set. Add it in Vercel → Project Settings → Environment Variables." } });
                                                                                                                                                        return;
                                                                                                                                                          }
                                                                                                                                                          
                                                                                                                                                            let payload;
                                                                                                                                                              try { payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
                                                                                                                                                                catch (e) { res.status(400).json({ error: { type: "bad_request", message: "Body was not valid JSON." } }); return; }
                                                                                                                                                                
                                                                                                                                                                  if (!payload || !Array.isArray(payload.messages)) {
                                                                                                                                                                      res.status(400).json({ error: { type: "bad_request", message: "Missing messages array." } });
                                                                                                                                                                          return;
                                                                                                                                                                            }
                                                                                                                                                                            
                                                                                                                                                                              const body = {
                                                                                                                                                                                  model: payload.model || "claude-sonnet-4-6",
                                                                                                                                                                                      max_tokens: Math.min(payload.max_tokens || 4096, 8192),
                                                                                                                                                                                          messages: payload.messages,
                                                                                                                                                                                            };
                                                                                                                                                                                            
                                                                                                                                                                                              try {
                                                                                                                                                                                                  const result = await anthropicRequest(apiKey, body);
                                                                                                                                                                                                      res.status(result.status).setHeader("Content-Type", "application/json").end(result.body);
                                                                                                                                                                                                        } catch (e) {
                                                                                                                                                                                                            res.status(502).json({ error: { type: "upstream_error", message: e && e.message ? e.message : "Unknown error" } });
                                                                                                                                                                                                              }
                                                                                                                                                                                                              };
                                                                                                                                                                                                              
