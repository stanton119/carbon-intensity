import requests
import datetime

import matplotlib.pyplot as plt
import pandas as pd

plt.style.use('seaborn-whitegrid')

# %% get forecast
# result = requests.get("https://api.carbonintensity.org.uk/regional/intensity/2018-05-15T12:00Z/fw48h/postcode/RG10")
# result = requests.get("https://api.carbonintensity.org.uk/regional/intensity/2022-01-14T00:00Z/fw48h/postcode/RG10")
result = requests.get(f"https://api.carbonintensity.org.uk/regional/intensity/{datetime.datetime.now().isoformat()}/fw48h/postcode/RG10")
result_dict = result.json()

data_dict = [[item['from'], item['intensity']['forecast']] for item in result_dict['data']['data']]
df_forecast = pd.DataFrame(data_dict, columns=['date','intensity'])

df_forecast.set_index('date').plot(figsize=(10,6))

# %% get historicals
date_ranges = pd.date_range('2021-01-01',datetime.date.today(), freq='13d')
dfs = []

for idx in range(len(date_ranges)-1):
    print(date_ranges[idx], date_ranges[idx+1])
    result = requests.get(f"https://api.carbonintensity.org.uk/regional/intensity/{date_ranges[idx].isoformat()}/{date_ranges[idx+1].isoformat()}/postcode/RG10")
    result_dict = result.json()

    data_dict = [[item['from'], item['intensity']['forecast']] for item in result_dict['data']['data']]
    dfs.append(pd.DataFrame(data_dict, columns=['date','intensity']))

df_hist = pd.concat(dfs, axis=0).drop_duplicates()

df_hist.set_index('date').rolling(48*7).mean().plot(figsize=(10,6))
df_hist.set_index('date').iloc[-300:].plot(figsize=(10,6))

