import urllib.request
import json
import ssl

# Bypass SSL verify for stability in dev envs
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

products = {
    'prototype': 'prod_Tn8lDBr1TmcGvp',
    'founder': 'prod_Tn8mJl8U7lAU3s',
    'agency': 'prod_Tn8nZb4nAdC0hr'
}
key = 'STRIPE_SECRET_KEY_HERE'

print("---START---")
for name, pid in products.items():
    try:
        url = f"https://api.stripe.com/v1/prices?product={pid}"
        req = urllib.request.Request(url)
        req.add_header("Authorization", f"Bearer {key}")
        
        with urllib.request.urlopen(req, context=ctx, timeout=10) as r:
            data = json.load(r)
            if data['data']:
                print(f"{name}={data['data'][0]['id']}")
            else:
                print(f"{name}=NO_PRICE_FOUND")
    except Exception as e:
        print(f"{name}=ERROR_{e}")
print("---END---")
