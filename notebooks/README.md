# Jupyter Notebook Examples

This set of jupyter notebooks act as a proof of concept implementation for the BTCR specification. The implementations have been created primarily with the [buidl-python](https://github.com/buidl-bitcoin/buidl-python) bitocin library from Jimmy Song.

# Prerequisites

- Python > v3.9
- pip

# Running the Notebooks

1. Create a virtual environment
`python -m venv venv` (python version in venv MUST be greater than 3.9)
2. Activate the environment
`source venv/bin/activate` (unbuntu/mac)
`.\venv\Scripts\activate` (windows)
3. Install python packages
`pip install -r requirements.txt`
4. Run a jupyter instance
`jupyter-lab .`
5. Walk through the notebooks at the URL provided in the terminal after running step 4. E.g. http://localhost:8888/lab?token=<sometoken>.
    - Notebooks currently under the Aggregation folder. Start with step A1. in Alexis and Satoshi notebooks.


