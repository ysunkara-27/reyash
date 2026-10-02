import {extendPractice} from './practice.mjs';
export const DATA = `import numpy as np
import pandas as pd
rng = np.random.default_rng(42)
orders = pd.DataFrame({
    'id': [1,2,3,4,5,6,6],
    'customer': ['a','b','a','c','b','d','d'],
    'region': [' East','west','east','WEST ',None,'east','east'],
    'amount': ['100','40','bad','80',None,'200','200'],
    'date': ['2026-09-01','2026-09-01','2026-09-02','2026-09-03','2026-09-03','2026-09-04','2026-09-04'],
    'paid': [True,False,True,True,False,True,True]
})
customers = pd.DataFrame({'customer':['a','b','c','d','e'], 'segment':['pro','basic','pro','basic','pro']})
df = orders.drop_duplicates('id').copy()
df['amount'] = pd.to_numeric(df['amount'], errors='coerce')
df['region'] = df['region'].str.strip().str.lower()
df['date'] = pd.to_datetime(df['date'])
`;
export const MODEL = `import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
X, y = make_classification(n_samples=1200, n_features=6, n_informative=4,
    n_redundant=0, weights=[0.7,0.3], class_sep=2.5, flip_y=0,
    random_state=42)
X = pd.DataFrame(X, columns=['tenure','spend','visits','tickets','usage','balance'])
X_train, X_other, y_train, y_other = train_test_split(X,y,test_size=0.4,stratify=y,random_state=42)
X_val, X_test, y_val, y_test = train_test_split(X_other,y_other,test_size=0.5,stratify=y_other,random_state=42)
`;
const code=(id,area,title,prompt,solution,checks,hint,setup=DATA,minutes=4)=>({id,area,title,prompt,solution,checks,hint,setup,minutes,type:'code'});
const num=(id,title,prompt,answer,explanation)=>({id,area:'Probability',title,prompt,answer,explanation,type:'number',minutes:2});
const mc=(id,title,prompt,options,answer,explanation)=>({id,area:'ML concepts',title,prompt,options,answer,explanation,type:'choice',minutes:1});
export const diagnostic = [
code('d1','Pandas','Select the right rows','Using cleaned df, set result to the id and amount columns for paid orders with amount >= 80. Preserve row order.',"result = df.loc[df['paid'] & (df['amount'] >= 80), ['id','amount']]",["assert list(result.columns)==['id','amount']", "assert result['id'].tolist()==[1,4,6]", "assert result['amount'].tolist()==[100,80,200]"],'Use parentheses around each condition, joined with &.'),
code('d2','Pandas','Summarize revenue','Set result to a DataFrame with columns customer, revenue. Sum known amounts per customer. Sort customer ascending. All-missing groups should total 0.',"result = df.groupby('customer',as_index=False).agg(revenue=('amount','sum')).sort_values('customer')",["assert list(result.columns)==['customer','revenue']","assert result['customer'].tolist()==['a','b','c','d']","assert result['revenue'].tolist()==[100,40,80,200]"],'groupby with as_index=False keeps customer as a column.'),
code('d3','Pandas','Join without inflation','Left-join customers onto df by customer. Set result to the merged DataFrame, with segment included; preserve the six orders.',"result = df.merge(customers, on='customer', how='left', validate='many_to_one')",["assert len(result)==6", "assert result['segment'].tolist()==['pro','basic','pro','pro','basic','basic']", "assert result['id'].is_unique"],'Check whether the right-side key is unique before merging.'),
code('d4','Cleaning','Recover numeric values','Starting with raw orders, set result to a numeric Series of amount. Invalid and missing values must become 0. Keep all seven rows.',"result = pd.to_numeric(orders['amount'],errors='coerce').fillna(0)",["assert len(result)==7","assert pd.api.types.is_numeric_dtype(result)","assert result.tolist()==[100,40,0,80,0,200,200]"],'to_numeric has an errors argument.'),
code('d5','Cleaning','Normalize labels','Set result to the raw orders region Series: remove surrounding whitespace, lowercase, and replace missing values with unknown.',"result = orders['region'].str.strip().str.lower().fillna('unknown')",["assert result.tolist()==['east','west','east','west','unknown','east','east']"],'Chain .str methods; handle missing values explicitly.'),
code('d6','Pandas','Same shape, group statistic','Set result to a Series giving each row of df the mean amount of that row’s customer. Preserve df index.',"result = df.groupby('customer')['amount'].transform('mean')",["assert result.index.equals(df.index)","assert result.tolist()==[100,40,100,80,40,200]"],'agg reduces rows; transform broadcasts a statistic back to each row.'),
code('d7','SQL','Filter in SQL','Create SQL string query selecting id and amount from table sales where amount >= 80, ordered by id.',"query = 'SELECT id, amount FROM sales WHERE amount >= 80 ORDER BY id'",["result = pd.read_sql_query(query, con)","assert result['id'].tolist()==[1,4,6]","assert list(result.columns)==['id','amount']"],'Use WHERE before ORDER BY.',DATA+"\nimport sqlite3\ncon = sqlite3.connect(':memory:')\ndf.to_sql('sales',con,index=False)\ncustomers.to_sql('customers',con,index=False)"),
code('d8','SQL','Filter groups','Create SQL string query returning customer and SUM(amount) AS revenue from sales. Include only customers with total revenue >= 90; sort customer.',"query = 'SELECT customer, SUM(amount) AS revenue FROM sales GROUP BY customer HAVING SUM(amount) >= 90 ORDER BY customer'",["result = pd.read_sql_query(query,con)","assert result['customer'].tolist()==['a','d']","assert result['revenue'].tolist()==[100,200]"],'HAVING filters aggregated groups.',DATA+"\nimport sqlite3\ncon=sqlite3.connect(':memory:')\ndf.to_sql('sales',con,index=False)"),
code('d9','SQL','Customers with no orders','Create SQL string query returning customer IDs from customers with no matching sales. Output column customer.',"query = 'SELECT c.customer FROM customers c LEFT JOIN sales s ON c.customer=s.customer WHERE s.id IS NULL'",["result=pd.read_sql_query(query,con)","assert result['customer'].tolist()==['e']"],'LEFT JOIN and test the missing right-side ID.',DATA+"\nimport sqlite3\ncon=sqlite3.connect(':memory:')\ndf.to_sql('sales',con,index=False)\ncustomers.to_sql('customers',con,index=False)"),
num('d10','Bayes without guessing','A condition affects 1% of people. A test detects 90% of cases; 5% of healthy people test positive. Given a positive test, what is the probability of the condition? Enter a decimal.',0.009/0.0585,'In 10,000 people: 90 true positives and 495 false positives. P(condition | positive) = 90/585 ≈ 0.153846. Conditional probability means probability after learning some information.'),
num('d11','Exactly two successes','Three independent calls each have a 0.5 chance of conversion. Probability exactly two convert? Enter a decimal.',0.375,'There are 3 placements of the failed call. Each sequence has probability 0.5³. Total = 3 × 0.125 = 0.375.'),
num('d12','Expected value','An outreach action earns $20 with probability 0.3 and $0 otherwise. It always costs $2. What is expected net value in dollars?',4,'Expected value is the probability-weighted average: 0.3 × 20 − 2 = $4.'),
num('d13','Choose a team','How many distinct unordered pairs can be selected from 6 people?',15,'Combinations count groups without order: 6 × 5 / 2 = 15.'),
mc('d14','Precision','True positives = 18; false positives = 2; false negatives = 6. Precision is…',['0.75','0.90','0.80','0.95'],[1],'Precision is the share of predicted positives that are correct: 18/(18+2)=0.9. Recall is 18/(18+6)=0.75.'),
mc('d15','Leakage','Which sequence gives a trustworthy holdout evaluation?',['Fit a scaler on all data, then split','Split, fit preprocessing on train, transform test','Tune the threshold on the final test labels','Choose features using all target labels'],[1],'Data leakage is information entering training that would not exist at prediction time. Hold out the test data before fitting learned preprocessing.'),
mc('d16','Overfitting','Train accuracy is 99%; validation accuracy is 70%. Select ALL reasonable responses.',['Limit tree depth','Check for leakage and split mismatch','Always add more model complexity','Try regularization'],[0,1,3],'Overfitting means memorizing training quirks that do not generalize. Simpler models and regularization can help. Also investigate whether the split represents deployment.'),
mc('d17','ROC-AUC','ROC-AUC of 0.8 means…',['80% accuracy at threshold 0.5','80% precision','A random positive usually ranks above a random negative, with probability 0.8 (ties half-weighted)','80% of positives are detected'],[2],'ROC-AUC measures ranking across thresholds. It does not specify accuracy, precision, or a useful operating threshold.'),
mc('d18','Imbalance','Fraud prevalence is 1%. Predicting no fraud gets 99% accuracy. Select ALL helpful next steps.',['Report recall and precision','Compare against a dummy baseline','Use accuracy alone','Evaluate business costs of errors'],[0,1,3],'A baseline is a simple reference model. With rare positives, accuracy can hide total failure to find them.'),
mc('d19','Outliers in errors','Which loss penalizes large errors more strongly?',['MAE','MSE','They are identical','Neither uses prediction errors'],[1],'MAE averages absolute errors. MSE averages squared errors, so large mistakes get disproportionately more weight.')
];
export const lessons = [];
function lesson(id,area,title,lines,example,drills,reference){lessons.push({id,area,title,lines,example,drills,reference});}
lesson('inspect','Pandas','Read a table without guessing',[
'A DataFrame is a table; a Series is one column with row labels.',
'Inspect shape (rows, columns), dtypes (column types), head, info, and missingness before changing anything.',
'NumPy arrays store numeric values efficiently. Vectorized operations act on whole columns rather than Python loops.'
],`from io import StringIO
sample = pd.read_csv(StringIO('id,value\\n1,10\\n2,20'))
print(sample.shape)  # (2, 2)
print(sample.head())
print(df.dtypes)
print(df.describe())
print(df.isna().sum())
print(np.where(df['paid'], 1, 0))`,[
code('a1','Pandas','Audit the export','Set result to a tuple: (raw order row count, raw order column count, unique order IDs).',"result = (len(orders), orders.shape[1], orders['id'].nunique())",["assert result==(7,6,6)"],'shape and nunique answer different questions.'),
code('a2','Pandas','Count missingness','Set result to the number of missing numeric amounts in cleaned df.',"result = int(df['amount'].isna().sum())",["assert result==2"],'bad was converted to NaN, the numeric missing marker.')
], 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html');
lesson('select','Pandas','Filter, select, sort',[
'.loc selects by row label or Boolean condition; .iloc selects by integer position.',
'Use & for AND, | for OR, and parentheses around comparisons. .query provides a string-based alternative.',
'Sort explicitly when output order matters. Select only requested columns; check the row count.'
],`print(df.loc[df['amount'] > 90, ['id','amount']]) # IDs 1, 6
print(df.iloc[:2, :2]) # first 2 rows, first 2 columns
print(df.query('amount > 90').sort_values('amount', ascending=False)['id'].tolist()) # [6,1]`,[
{...diagnostic[0],id:'a3'},code('a4','Pandas','A variant from memory','Return result with id and amount for unpaid orders with a known amount, sorted amount descending.',"result = df.loc[(~df['paid']) & df['amount'].notna(), ['id','amount']].sort_values('amount',ascending=False)",["assert list(result.columns)==['id','amount']","assert result['id'].tolist()==[2]","assert result['amount'].tolist()==[40]"],'Negate a Boolean Series with ~.')
]);
lesson('aggregate','Pandas','Group, aggregate, broadcast',[
'groupby splits rows into groups. agg reduces each group to summaries; named aggregation controls output column names.',
'transform gives a group statistic back to every original row. value_counts counts occurrences; nunique counts distinct values.',
'reset_index turns index labels into columns. Use drop=True when the old index is irrelevant.'
],`print(df.groupby('region', dropna=False).agg(revenue=('amount','sum'), orders=('id','count')))
print(df['customer'].value_counts().to_dict()) # a:2, b:2, c:1, d:1
print(df.groupby('customer')['amount'].transform('mean').tolist()) # [100,40,100,80,40,200]`,[{...diagnostic[1],id:'a5'},{...diagnostic[5],id:'a6'}]);
lesson('joins','Pandas','Join tables safely',[
'A join attaches matching rows using a key. Inner keeps matches, left keeps all left rows, outer keeps either side.',
'Duplicate keys can multiply rows. validate="many_to_one" requires unique right keys; inspect shape after every join.',
'Use left_on/right_on for differently named keys and suffixes for overlapping names. concat stacks tables; it does not match keys.'
],`joined = df.merge(customers, on='customer', how='left', validate='many_to_one')
assert len(joined) == len(df)
stacked = pd.concat([df.iloc[:3],df.iloc[3:]],ignore_index=True)
assert len(stacked) == 6`,[{...diagnostic[2],id:'a7'},code('a8','Pandas','Keep customers without orders','Set result to a sorted Python list of customer IDs with no orders, using pandas.',"result = sorted(customers.loc[~customers['customer'].isin(df['customer']), 'customer'].tolist())",["assert result==['e']"],'isin tests membership in a set of values.')]);
lesson('reshape','Pandas','Reshape and derive columns',[
'pivot_table makes categories into columns and aggregates duplicates; melt reverses wide columns into long rows.',
'map replaces individual values using a mapping. apply runs a function; prefer built-in vectorized operations when possible.',
'np.where chooses between two values. np.select handles multiple ordered conditions; the first matching condition wins.'
],`wide = df.pivot_table(index='customer', columns='paid', values='amount', aggfunc='sum',fill_value=0)
long = wide.reset_index().melt(id_vars='customer',var_name='paid',value_name='revenue')
print(np.where(df['amount']>=100,'high','low').tolist()) # high, low, low, low, low, high
print(df['paid'].map({True:'yes',False:'no'}).tolist())`,[
code('a9','Pandas','Make a tier','Set result to a Series or array: unknown for missing amount; high for >=100; low otherwise.',"result = np.select([df['amount'].isna(),df['amount']>=100],['unknown','high'],default='low')",["assert list(result)==['high','low','unknown','low','unknown','high']"],'Check missingness first.'),
code('a10','Pandas','Pivot from memory','Create result: sum of amount by customer (index) and paid (columns), filling absent combinations with zero.',"result = df.pivot_table(index='customer',columns='paid',values='amount',aggfunc='sum',fill_value=0)",["assert result.shape==(4,2)","assert result.loc['a',True]==100", "assert result.loc['b',False]==40", "assert result.loc['d',False]==0"],'Use pivot_table, not pivot, when key pairs can repeat.')
]);
lesson('time','Pandas','Dates, windows, and ranking',[
'pd.to_datetime parses timestamps; .dt exposes date parts. Sort time before shift, diff, rolling, or cumulative calculations.',
'shift reads a previous row; diff subtracts it. rolling summarizes a sliding window; resample groups a datetime index into time buckets.',
'rank assigns positions, cumsum accumulates totals, cut uses value bins, and qcut makes approximate equal-count bins (ties can be tricky).'
],`daily = df.set_index('date')['amount'].resample('D').sum()
print(daily.tolist()) # [140,0,80,200]
print(daily.rolling(2).mean().tolist()) # [nan,70,40,140]
print(daily.diff().tolist()) # [nan,-140,80,120]
print(pd.cut(df['amount'],bins=[0,100,300],labels=['small','large'],include_lowest=True))`,[
code('a11','Pandas','Running revenue','Set result to daily total revenue followed by its cumulative sum, as a Series ordered by date. Missing amounts contribute 0.',"result = df.set_index('date')['amount'].resample('D').sum().cumsum()",["assert result.tolist()==[140,140,220,420]"],'Aggregate per day first; then cumsum.'),
code('a12','Pandas','Dense revenue rank','Set result to descending dense rank of df amount; ties share a rank, missing values stay missing.',"result = df['amount'].rank(method='dense',ascending=False)",["assert result.dropna().tolist()==[2,4,3,1]","assert result.isna().sum()==2"],'rank has method and ascending options.')
]);
lesson('clean','Cleaning','Make messy data usable',[
'NaN represents a missing numeric value. Coerce bad strings to NaN, then choose an explicit missing-value policy.',
'Imputation fills missing values: median for numeric, mode (most common value) for categories, or a group statistic when justified.',
'Preserve a missingness indicator before filling. Decide what a duplicate means using a business key, not just identical rows.'
],`clean = orders.drop_duplicates('id', keep='last').copy()
clean['amount'] = pd.to_numeric(clean['amount'],errors='coerce')
clean['amount_missing'] = clean['amount'].isna()
clean['amount'] = clean['amount'].fillna(clean['amount'].median()) # median 90
clean['region'] = clean['region'].str.strip().str.lower().fillna('unknown')`,[
{...diagnostic[3],id:'b1'},{...diagnostic[4],id:'b2'},
code('b3','Cleaning','Impute by customer','Set result to df amount filled with its customer mean, keeping the same row index.',"result = df['amount'].fillna(df.groupby('customer')['amount'].transform('mean'))",["assert result.tolist()==[100,40,100,80,40,200]"],'Use transform so the group means align to original rows.')
]);
lesson('outliers','Cleaning','Outliers, encoding, and scaling',[
'The IQR is the 75th percentile minus the 25th; values beyond 1.5 IQR from those quartiles are a common flag, not automatic errors.',
'One-hot encoding makes one column per category; ordinal encoding implies an order. Target encoding uses label averages and can leak unless fitted within training folds.',
'StandardScaler centers and scales using training mean and standard deviation; MinMaxScaler maps training range. log1p compresses nonnegative skewed values.'
],`s = pd.Series([1.,2.,3.,4.,100.])
q1,q3 = s.quantile([.25,.75]); iqr=q3-q1
print(s.clip(q1-1.5*iqr,q3+1.5*iqr).tolist()) # [1,2,3,4,7]
print(pd.get_dummies(df['region'],dummy_na=True).shape) # (6,3)
z = (s-s.mean())/s.std(ddof=0)
print(np.log1p(pd.Series([0,9,99])))`,[
code('b4','Cleaning','Clip a sensor spike','For s = Series([1.,2.,3.,4.,100.]), return result clipped using the 1.5 IQR fences.',"s=pd.Series([1.,2.,3.,4.,100.])\nq1,q3=s.quantile([.25,.75])\nresult=s.clip(q1-1.5*(q3-q1),q3+1.5*(q3-q1))",["assert result.tolist()==[1,2,3,4,7]"],'Compute quartiles before changing the Series.')
]);
lesson('sql','SQL','SQL through Python',[
'SQL describes which table rows to retrieve. WHERE filters rows; GROUP BY groups; HAVING filters group summaries.',
'A CTE (WITH name AS ...) names an intermediate query. CASE WHEN creates conditional values; LEFT JOIN preserves unmatched left rows.',
'Run SQL in Python with sqlite3 and pd.read_sql_query. SQLite date functions differ from other SQL dialects.'
],`import sqlite3
con=sqlite3.connect(':memory:')
df.to_sql('sales',con,index=False)
print(pd.read_sql_query("SELECT customer, SUM(amount) AS revenue FROM sales GROUP BY customer HAVING SUM(amount)>90 ORDER BY customer",con)) # a:100, d:200
print(pd.read_sql_query("SELECT id, CASE WHEN amount >= 100 THEN 'high' ELSE 'low' END AS tier FROM sales",con))`,diagnostic.slice(6,9).map((d,i)=>({...d,id:'c'+i})), 'https://docs.python.org/3/library/sqlite3.html');
lesson('windows','SQL','Top-N and previous rows',[
'A window function computes over related rows without collapsing them. PARTITION BY creates groups within that computation.',
'ROW_NUMBER gives unique positions (add tie-breakers); RANK leaves gaps after ties. LAG and LEAD read neighboring rows.',
'Use a CTE to filter window results. Specify ROWS for a row-based running sum; dedupe by keeping row number 1.'
],`query = '''WITH ranked AS (
SELECT *, ROW_NUMBER() OVER (
PARTITION BY customer ORDER BY amount DESC, id ASC) AS rn
FROM sales)
SELECT customer, id FROM ranked WHERE rn=1 ORDER BY customer'''
# For the supplied sales: a→1, b→2, c→4, d→6`,[
code('c3','SQL','Top order per customer','Write query returning customer and id of highest-amount sale for each customer. Tie-break by smallest id; sort customer. Null amounts should not beat known amounts.',"query = '''WITH r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY customer ORDER BY amount DESC, id ASC) rn FROM sales) SELECT customer,id FROM r WHERE rn=1 ORDER BY customer'''",["result=pd.read_sql_query(query,con)","assert result['id'].tolist()==[1,2,4,6]","assert result['customer'].tolist()==['a','b','c','d']"],'ROW_NUMBER inside a CTE; filter rn=1 outside.',diagnostic[6].setup)
]);
lesson('eda','EDA','Find a pattern, then question it',[
'EDA means exploratory data analysis: inspect distributions, groups, and relationships before modeling.',
'A histogram shows a distribution; a boxplot summarizes spread and extreme values; correlation measures association, not causation.',
'Write two sentences: what changed and why it matters, then a caveat. A pattern can come from missing data, small groups, or leakage.'
],`import matplotlib.pyplot as plt
fig,ax=plt.subplots()
ax.hist(df['amount'].dropna(),bins=4)
ax.set(title='Known order amounts',xlabel='Amount ($)',ylabel='Orders')
plt.show()
print(df[['amount','paid']].corr())
# Four known amounts span $40–$200. Investigate the two missing amounts before comparing customer value.`,[
code('e1','EDA','Group comparison','Return result with columns paid, mean_amount, n_known. Group by paid, aggregate mean amount and count of nonmissing amounts, order False then True.',"result=df.groupby('paid',as_index=False).agg(mean_amount=('amount','mean'), n_known=('amount','count'))",["assert result['n_known'].tolist()==[1,3]","assert np.allclose(result['mean_amount'],[40,380/3])"],'count excludes missing values; size counts all rows.'),
code('e2','EDA','Make a labeled plot','Create fig, ax with a histogram of nonmissing amounts. Label x Amount ($), y Orders, and title Known order amounts. Run here to preview or in your notebook.',"import matplotlib.pyplot as plt\nfig,ax=plt.subplots()\nax.hist(df['amount'].dropna(),bins=4)\nax.set(xlabel='Amount ($)',ylabel='Orders',title='Known order amounts')",["assert ax.get_xlabel()=='Amount ($)'","assert ax.get_ylabel()=='Orders'","assert ax.get_title()=='Known order amounts'","assert len(ax.patches)>0"],'Use ax.set with xlabel, ylabel and title.')
]);
lesson('pipeline','Modeling','Split first. Fit second.',[
'Features X are inputs; target y is what you predict. Training fits the model, validation selects settings, and test measures final performance once.',
'A Pipeline applies preprocessing and the estimator together. A ColumnTransformer applies different steps to numeric and categorical columns.',
'Fit learned transformations only on training data. Stratify preserves class ratios; time data usually needs a chronological split instead.'
],`from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
numeric = Pipeline([('fill',SimpleImputer(strategy='median')),('scale',StandardScaler())])
category = Pipeline([('fill',SimpleImputer(strategy='most_frequent')),('encode',OneHotEncoder(handle_unknown='ignore'))])
# Example with mixed columns: replace lists with your actual columns.
pre = ColumnTransformer([('num',numeric,['spend']),('cat',category,['region'])])
pipe = Pipeline([('prep',pre),('model',LogisticRegression(max_iter=1000))])
# pipe.fit(X_train, y_train) when X_train has spend and region`,[
code('m1','Modeling','First classifier','Using the supplied numeric train/validation/test split, fit a StandardScaler + LogisticRegression pipeline on X_train, y_train. Save as model. Set predictions = model.predict(X_val).',"from sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.linear_model import LogisticRegression\nmodel=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000,random_state=42))\nmodel.fit(X_train,y_train)\npredictions=model.predict(X_val)",["assert len(predictions)==len(y_val)","assert set(predictions).issubset({0,1})","from sklearn.metrics import accuracy_score\nassert accuracy_score(y_val,predictions)>.8", "from sklearn.pipeline import Pipeline\nassert isinstance(model,Pipeline)"],'make_pipeline combines steps; fit the pipeline, not each split separately.',MODEL,8)
], 'https://scikit-learn.org/stable/common_pitfalls.html');
lesson('metrics','Modeling','Choose the right measurement',[
'Precision = TP/(TP+FP); recall = TP/(TP+FN); F1 is their harmonic mean. A confusion matrix counts TN, FP, FN, TP for binary labels [0,1].',
'ROC-AUC uses scores, not hard labels, to evaluate ranking. With rare positives also inspect precision-recall performance and business costs.',
'Regression predicts numbers: MAE is mean absolute error; MSE is mean squared error; RMSE is its square root; R² compares squared error to predicting the mean and can be negative.'
],`from sklearn.metrics import precision_score,recall_score,f1_score,confusion_matrix,mean_squared_error
truth=[1,1,1,0,0]; pred=[1,0,1,1,0]
print(precision_score(truth,pred)) # 2/3
print(recall_score(truth,pred)) # 2/3
print(confusion_matrix(truth,pred,labels=[0,1])) # [[1,1],[1,2]]
print(np.sqrt(mean_squared_error([2,4],[3,2]))) # sqrt(2.5)`,[
code('m2','Modeling','Metrics from counts','Return result tuple (precision, recall, f1) when TP=18, FP=2, FN=6.',"p=18/(18+2)\nr=18/(18+6)\nresult=(p,r,2*p*r/(p+r))",["assert np.allclose(result,[.9,.75,9/11])"],'F1 = 2PR/(P+R).')
], 'https://scikit-learn.org/stable/modules/model_evaluation.html');
lesson('threshold','Modeling','Meet a precision target honestly',[
'predict_proba returns class probabilities; a threshold converts positive-class scores into decisions.',
'Raising the threshold usually trades recall for precision, but measured precision is not guaranteed to increase at every step.',
'Tune on validation only; report support (how many predicted positives), recall, and final test performance. Zero positive predictions is not a valid success.'
],`from sklearn.metrics import precision_score, recall_score
scores=np.array([.9,.8,.6,.4]); truth=np.array([1,0,1,0])
for threshold in [.5,.85]:
    pred=scores>=threshold
    print(threshold,precision_score(truth,pred,zero_division=0),recall_score(truth,pred))
# .5 → precision 2/3, recall 1; .85 → precision 1, recall .5`,[
code('m3','Modeling','Pick a threshold','scores=[.95,.85,.75,.65,.55,.45], truth=[1,1,0,1,0,0]. From thresholds [.5,.6,.7,.8,.9], choose the one with highest recall among those with precision >= .95 and at least one predicted positive. Set result to the threshold.',"from sklearn.metrics import precision_score,recall_score\nscores=np.array([.95,.85,.75,.65,.55,.45]); truth=np.array([1,1,0,1,0,0])\nchoices=[]\nfor t in [.5,.6,.7,.8,.9]:\n    pred=scores>=t\n    if pred.sum()>0 and precision_score(truth,pred,zero_division=0)>=.95:\n        choices.append((recall_score(truth,pred),t))\nresult=max(choices)[1]",["assert abs(result-.8)<1e-9"],'At .8, two correct positives remain; at .9, only one.')
]);
lesson('models','Modeling','Start simple, improve deliberately',[
'DummyClassifier gives a baseline. LogisticRegression is a linear classifier; a DecisionTree learns rules; RandomForest averages randomized trees; GradientBoosting builds sequential error-correcting trees.',
'Cross-validation rotates held-out training folds. GridSearchCV compares settings within those folds; keep the final test set untouched.',
'Regularization discourages complexity: L1 can set coefficients to zero; L2 shrinks them. Scaling matters for linear and distance-based models, usually not trees.'
],`from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score,GridSearchCV
# Use MODEL dataset from the drill.
# baseline=DummyClassifier(strategy='most_frequent').fit(X_train,y_train)
# model=RandomForestClassifier(n_estimators=100,max_depth=6,random_state=42,n_jobs=1)
# scores=cross_val_score(model,X_train,y_train,cv=3,scoring='f1')
# search=GridSearchCV(model,{'max_depth':[3,6]},cv=3,scoring='f1')
# search.fit(X_train,y_train)
# Tree impurity importance can favor high-cardinality features; verify with held-out permutation importance.`,[
code('m4','Modeling','Beat the baseline','Fit model = RandomForestClassifier with 80 trees, max_depth=6 and random_state=42. Set predictions on X_val. Achieve validation accuracy >= .85.',"from sklearn.ensemble import RandomForestClassifier\nmodel=RandomForestClassifier(n_estimators=80,max_depth=6,random_state=42,n_jobs=1).fit(X_train,y_train)\npredictions=model.predict(X_val)",["assert len(predictions)==len(y_val)","from sklearn.metrics import accuracy_score\nassert accuracy_score(y_val,predictions)>=.85"],'Fit once on the training split, predict on validation.',MODEL,8)
]);
lesson('probability','Probability','Probability by counting',[
'Conditional probability P(A|B) restricts attention to B. Bayes reverses the condition: P(A|B)=P(B|A)P(A)/P(B).',
'Independence means knowing one event does not change the probability of the other. Expected value is the probability-weighted mean.',
'A binomial counts successes in n independent trials with equal probability p: P(K=k)=C(n,k)p^k(1-p)^(n-k). Combinations ignore order; permutations keep order.'
],`from math import comb,perm
print(comb(6,2)) # 15
print(perm(6,2)) # 30
print(comb(3,2)*.5**2*.5) # .375
print(.9*.01/(.9*.01+.05*.99)) # .153846...`,diagnostic.slice(9,13).map((d,i)=>({...d,id:'p'+i})));
lesson('stats','Probability','Statistics without jargon',[
'A normal distribution is a symmetric bell curve described by mean and standard deviation. A z-score counts standard deviations from the mean.',
'A p-value is the probability, under the null hypothesis and assumptions, of a result at least as extreme as observed; it is not the probability the null is true.',
'A 95% confidence-interval procedure covers the fixed true parameter in 95% of repeated samples. The central limit theorem approximates distributions of sample means under suitable conditions; biased sampling still gives biased conclusions.'
],`# Normal approximation for a sample mean: mean ± 1.96 * standard error.
# Standard error = sample standard deviation / sqrt(n).
mean,sd,n=50,10,100
print((mean-1.96*sd/np.sqrt(n),mean+1.96*sd/np.sqrt(n))) # (48.04,51.96)
# This approximation requires appropriate sampling and a suitable sampling distribution.`,[
num('p4','Standardize','A value is 70, mean 50, standard deviation 10. What is its z-score?',2,'z=(70−50)/10=2.'),
num('p5','Uncertainty','Sample standard deviation is 12 and n=36 independent observations. What is the estimated standard error of the mean?',2,'12/sqrt(36)=2. This measures uncertainty in the mean, not spread of individual observations.')
]);
export const quiz = [...diagnostic.slice(13).map(q=>({...q,id:'quiz-'+q.id})),
mc('q1','Bagging vs boosting','Which describes bagging?',['Sequentially fitting errors','Combining models trained on resampled datasets','Removing every weak feature','Optimizing only precision'],[1],'Bagging trains models on resampled data and combines predictions; it often reduces variance. Boosting adds models sequentially to improve an objective.'),
mc('q2','Activations','Select ALL correct matches.',['ReLU: max(0,x)','Sigmoid: values between 0 and 1','Softmax: outputs sum to 1 across classes','tanh: outputs only nonnegative values'],[0,1,2],'An activation adds nonlinearity to a neural network. tanh ranges from −1 to 1; softmax normalizes class scores.'),
mc('q3','Scaling','Which methods typically need careful feature scaling? Select ALL.',['k-NN','k-means','Random forest','L2-regularized logistic regression'],[0,1,3],'k-NN predicts from nearby samples; k-means groups nearby samples. Their distances and regularization penalties depend on feature scale.'),
mc('q4','PCA','PCA primarily…',['Finds directions of high feature variance','Maximizes classification accuracy using labels','Clusters data into a selected number of groups','Proves causation'],[0],'Principal component analysis (PCA) rotates data into directions of greatest variance, often reducing dimensions. It does not use target labels.'),
mc('q5','Regularization','Select ALL correct statements.',['L1 can produce zero coefficients','L2 penalizes squared coefficient size','More regularization always improves test accuracy','Regularization can reduce overfitting'],[0,1,3],'Regularization trades flexibility for stability. Too much can underfit: miss real signal.'),
mc('q6','Validation','You must choose a decision threshold. Which labels should you use?',['Final test labels repeatedly','Validation labels','No labels are ever useful','The customer ID'],[1],'Choose on validation; evaluate once on the final test. Repeatedly using test labels turns the test into a validation set.'),
mc('q7','Clustering','Hierarchical clustering differs from k-means because it can…',['Produce a tree of nested clusters','Require labeled outcomes','Guarantee the true groups','Ignore the distance definition'],[0],'Hierarchical clustering builds nested groups, often displayed as a dendrogram. k-means seeks a fixed number of centroid-based clusters.'),
mc('q8','Sampling','A customer survey only includes app power users. The most immediate concern is…',['Sampling bias','Too much regularization','Perfect randomization','A small p-value'],[0],'Sampling bias means the observed sample systematically differs from the population you want to understand.'),
mc('q9','Confidence','Which interpretation of a p-value of .03 is valid?',['The null is 3% likely','The result has a 97% chance of replication','Under the null and assumptions, results at least this extreme have probability .03','The effect is large'],[2],'A p-value concerns the data under an assumed null model. It does not measure effect size, business importance, or probability of a hypothesis.'),
mc('q10','Model choice','A fraud team can inspect only 50 alerts a day. Which is the most relevant evaluation?',['Accuracy alone','Precision and recall at the review capacity, with estimated error costs','Training loss alone','Number of model parameters'],[1],'Translate scores into the actual decision: a fixed review queue. Quantify both useful alerts and missed fraud.'),
mc('q11','Bias and variance','A simple model performs poorly on both training and validation data. Most likely…',['High bias / underfitting','High variance only','Perfect calibration','Guaranteed leakage'],[0],'Bias is systematic error from restrictive assumptions; variance is sensitivity to the training sample. Poor performance on both suggests underfitting, although data quality also matters.'),
mc('q12','Class weights','Select ALL true statements about class_weight.',['Changes the training penalty of classes','Guarantees precision > .95','Can change the recall/precision trade-off','Still requires validation'],[0,2,3],'Class weights change the objective. They do not guarantee a particular metric and can increase false positives.'),
mc('q13','Regression','R² = −0.2 on a held-out set means…',['The model beats the mean baseline','Squared error is worse than predicting the evaluation-set mean','There is negative 20% accuracy','The code must be broken'],[1],'R² = 1 − residual sum of squares / total sum of squares. It can be negative when prediction error exceeds the mean baseline.'),
mc('q14','Time data','Predicting next month’s churn. Select ALL sound actions.',['Split chronologically','Use future cancellation date as a feature','Use only features available at prediction time','Keep one customer’s duplicate records from leaking across splits'],[0,2,3],'Match the split and feature availability to deployment. Future knowledge gives misleadingly good offline scores.')
];
export function mockTasks(version){
const seed=version===1?73:107;
const setup=`import numpy as np\nimport pandas as pd\nrng=np.random.default_rng(${seed})\norders=pd.DataFrame({'id':np.arange(1,81),'customer':rng.choice(list('abcdefgh'),80),'amount':rng.integers(10,250,80).astype(str),'status':rng.choice([' PAID ','paid','cancelled'],80),'date':pd.date_range('2026-09-01',periods=80,freq='h')})\norders.loc[[3,11,25],'amount']=['bad',None,'-20']\norders=pd.concat([orders,orders.iloc[[0,10]]],ignore_index=True)\ncustomers=pd.DataFrame({'customer':list('abcdefghi'),'segment':['pro','basic','pro','basic','pro','basic','pro','basic','pro']})\n`;
const wrangle=code('mock'+version+'a','Pandas','The revenue reconciliation','A retailer sent an order export after a retry in their ingestion service. Finance wants one row per customer, including customers who never ordered. A repeated id is one transaction: keep the last record. Status is inconsistently formatted. Count only paid orders with a valid, nonnegative amount; invalid values must not quietly become revenue. Return result with exactly customer, segment, revenue, order_count. Fill absent totals with zero, keep order_count integer, and sort revenue descending with customer ascending as the tie-break. The account team needs all nine customers, not just those with revenue.',`x=orders.drop_duplicates('id',keep='last').copy()
x['amount']=pd.to_numeric(x['amount'],errors='coerce')
x['status']=x['status'].str.strip().str.lower()
x=x.loc[(x['status']=='paid') & x['amount'].ge(0)]
s=x.groupby('customer',as_index=False).agg(revenue=('amount','sum'),order_count=('id','count'))
result=customers.merge(s,on='customer',how='left',validate='one_to_one')
result[['revenue','order_count']]=result[['revenue','order_count']].fillna(0)
result['order_count']=result['order_count'].astype(int)
result=result.sort_values(['revenue','customer'],ascending=[False,True]).reset_index(drop=True)`,[], 'Clean and dedupe before aggregating; start the final join from customers.',setup,22);
wrangle.checks=["assert list(result.columns)==['customer','segment','revenue','order_count']","assert len(result)==9 and result['customer'].is_unique","assert pd.api.types.is_integer_dtype(result['order_count'])","pd.testing.assert_frame_equal(result.reset_index(drop=True), expected.reset_index(drop=True),check_dtype=False)"];
wrangle.reference=wrangle.solution.replaceAll('result','expected');
const clean=code('mock'+version+'b','Cleaning','Features for tomorrow’s scoring job','Operations needs an order-level feature table, before any model training. Starting from the raw export, keep the last record of each id, ordered by id. Create amount_numeric with invalid strings coerced to missing. A negative amount is a refund, not a missing value: retain it. Create amount_missing before filling; leave amount_numeric unfilled. Normalize status. Parse dates and add hour as an integer from 0 to 23. Return result with exactly id, amount_numeric, amount_missing, status, hour. Do not learn a median from the full export: that would belong inside a training-only preprocessing step.',`result=orders.drop_duplicates('id',keep='last').sort_values('id').copy()
result['amount_numeric']=pd.to_numeric(result['amount'],errors='coerce')
result['amount_missing']=result['amount_numeric'].isna()
result['status']=result['status'].str.strip().str.lower()
result['hour']=pd.to_datetime(result['date']).dt.hour
result=result[['id','amount_numeric','amount_missing','status','hour']].reset_index(drop=True)`,[], 'Invalid and negative are different cases. Preserve the indicator before any imputation.',setup,20);
clean.reference=clean.solution.replaceAll('result','expected');clean.checks=["assert len(result)==80 and result['id'].is_unique","assert result['amount_missing'].sum()==2","assert (result['amount_numeric']<0).sum()==1","pd.testing.assert_frame_equal(result.reset_index(drop=True),expected,check_dtype=False)"];
const model=code('mock'+version+'c','Modeling','A limited fraud review queue','The review team needs reliable alerts. The synthetic numeric data represents transactions, with class 1 indicating fraud. Use only X_train/y_train to fit. Set model to a fitted classifier. Choose threshold using X_val/y_val, aiming for precision >= 0.95 and recall >= 0.50 with at least 10 alerts. Set val_predictions from that threshold. Then set test_predictions from the same threshold on X_test. Do not use test labels to change your decisions. This exercise awards held-out performance points, but no model can guarantee the same metric on new data. Keep a working baseline before trying a more complex model.',`from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score,recall_score
model=RandomForestClassifier(n_estimators=120,max_depth=8,random_state=42,n_jobs=1).fit(X_train,y_train)
scores=model.predict_proba(X_val)[:,1]
choices=[]
for t in np.linspace(.1,.95,86):
    p=scores>=t
    if p.sum()>=10 and precision_score(y_val,p,zero_division=0)>=.95:
        choices.append((recall_score(y_val,p),float(t)))
threshold=max(choices)[1] if choices else .5
val_predictions=scores>=threshold
test_predictions=model.predict_proba(X_test)[:,1]>=threshold`,["assert len(val_predictions)==len(y_val) and len(test_predictions)==len(y_test)","assert np.array_equal(val_predictions,model.predict_proba(X_val)[:,1]>=threshold)","assert np.array_equal(test_predictions,model.predict_proba(X_test)[:,1]>=threshold)","from sklearn.metrics import precision_score,recall_score\nassert val_predictions.sum()>=10 and precision_score(y_val,val_predictions,zero_division=0)>=.95 and recall_score(y_val,val_predictions)>=.5","assert precision_score(y_test,test_predictions,zero_division=0)>=.90 and recall_score(y_test,test_predictions)>=.5"],'Try a small random forest; select threshold on validation, then freeze it.',MODEL.replaceAll('random_state=42','random_state='+seed),25);
return [num('mock'+version+'p1','Conditional risk',version===1?'2% of events are faults. A detector catches 80% of faults and flags 4% of nonfaults. Given a flag, probability of fault? Decimal.':'5% of messages are spam. A filter catches 90% of spam and flags 10% of nonspam. Given a flag, probability of spam? Decimal.',version===1?.016/.0552:.045/.14,'Use true positives divided by all positives. Include false positives from the much larger negative population.'),num('mock'+version+'p2','Independent conversions',version===1?'Four independent visitors each buy with probability .25. Probability exactly one buys? Decimal.':'Five independent visitors each buy with probability .2. Probability exactly two buy? Decimal.',version===1?4*.25*.75**3:10*.2**2*.8**3,'Use C(n,k) × p^k × (1−p)^(n−k).'),...quiz.slice(version===1?6:12,version===1?12:18).map((q,i)=>({...q,id:'mock'+version+'q'+i})),wrangle,clean,model];
}
export const exams=[{id:'mini',name:'Mini-mock',minutes:45,day:3,tasks:[...quiz.slice(0,4).map(q=>({...q,id:'mini'+q.id,setup:q.setup?.replace('default_rng(73)','default_rng(37)')})),...mockTasks(1).slice(-3,-1).map(q=>({...q,id:'mini'+q.id,setup:q.setup?.replace('default_rng(73)','default_rng(37)')}))]},{id:'full1',name:'Full mock A',minutes:90,day:5,tasks:mockTasks(1)},{id:'full2',name:'Full mock B',minutes:90,day:7,tasks:mockTasks(2)}];
// Additional transfer drills: mixed inputs, regression, and SQL windows.
lessons.find(l=>l.id==='pipeline').drills.push(code('m5','Modeling','Mixed data, one safe pipeline','Use the supplied mixed feature data. Build model as a Pipeline with a ColumnTransformer: numeric columns use median imputation then StandardScaler; region uses most-frequent imputation and OneHotEncoder(handle_unknown="ignore"). Finish with LogisticRegression(max_iter=1000). Fit on train only; set predictions for X_val, including its unseen region.',`from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler,OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
num=Pipeline([('impute',SimpleImputer(strategy='median')),('scale',StandardScaler())])
cat=Pipeline([('impute',SimpleImputer(strategy='most_frequent')),('encode',OneHotEncoder(handle_unknown='ignore'))])
prep=ColumnTransformer([('num',num,['tenure','spend','visits','tickets','usage','balance']),('cat',cat,['region'])])
model=Pipeline([('prep',prep),('classifier',LogisticRegression(max_iter=1000))])
model.fit(X_train,y_train)
predictions=model.predict(X_val)`,["assert len(predictions)==len(y_val)","from sklearn.pipeline import Pipeline\nassert isinstance(model,Pipeline)","from sklearn.compose import ColumnTransformer\nassert any(isinstance(step,ColumnTransformer) for _,step in model.steps)","from sklearn.metrics import accuracy_score\nassert accuracy_score(y_val,predictions)>.8"],'Use separate numeric and categorical pipelines inside one ColumnTransformer.',MODEL+`\nX_train=X_train.copy();X_val=X_val.copy()
X_train['region']=np.where(X_train['tenure']>0,'east','west')
X_val['region']='new region'
X_train.loc[X_train.index[:10],'spend']=np.nan
X_val.loc[X_val.index[:5],'spend']=np.nan
`,12));
lessons.find(l=>l.id==='metrics').drills.push(code('m6','Modeling','Regression errors from memory','Truth is [100,200,300]; predictions are [110,180,330]. Return result tuple (MAE, MSE, RMSE, R2), using scikit-learn metrics.',`from sklearn.metrics import mean_absolute_error,mean_squared_error,r2_score
truth=[100,200,300];pred=[110,180,330]
mse=mean_squared_error(truth,pred)
result=(mean_absolute_error(truth,pred),mse,np.sqrt(mse),r2_score(truth,pred))`,["assert np.allclose(result,[20,1400/3,np.sqrt(1400/3),.93])"],'Absolute errors are 10,20,30. Squared errors are 100,400,900.'));
lessons.find(l=>l.id==='windows').drills.push(code('c4','SQL','Running customer revenue','Write query returning id and running_total for all sales. Sum COALESCE(amount,0) within each customer in date,id order with a ROWS window. Order the final output by id.',`query='''SELECT id, SUM(COALESCE(amount,0)) OVER (
PARTITION BY customer ORDER BY date,id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running_total FROM sales ORDER BY id'''`,["result=pd.read_sql_query(query,con)","assert result['id'].tolist()==[1,2,3,4,5,6]","assert result['running_total'].tolist()==[100,40,100,80,40,200]"],'COALESCE supplies a value for NULL. Use a window SUM rather than GROUP BY.',diagnostic[6].setup));

extendPractice({lessons,quiz,exams,MODEL});
