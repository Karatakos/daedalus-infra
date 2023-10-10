# -*- coding: utf-8 -*-

from locust import HttpUser, task, between
from lib.utility import status_page

default_headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36'}

class WebsiteUser(HttpUser):
    @task(1)
    def get_random_page(self):
        self.client.get(status_page(), headers=default_headers)