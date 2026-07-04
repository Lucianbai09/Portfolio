# Lucian Bai portfolio

Personal portfolio website built with Flask (Jinja2), HTML, CSS, and JavaScript.

## Run locally

```
pip install -r requirements.txt
python app.py
```

Then open http://127.0.0.1:5000 in your browser.

## Deploy

Hosted on [Vercel](https://vercel.com) — `vercel.json` routes `/static/*` to the CDN
and everything else to the Flask app. Push to `main` to deploy.
