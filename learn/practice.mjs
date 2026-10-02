// Original business exercises aligned to the invite's practical focus areas.
export function extendPractice({lessons,quiz,exams,MODEL}) {
const base=`import numpy as np
import pandas as pd
rng=np.random.default_rng(2026)
`;
const retail=base+`sales=pd.DataFrame({
'order':[101,102,103,104,105,106,107,108,102],
'customer':['a','a','b','b','c','c','d','d','a'],
'channel':[' web ','store','web','STORE','web',None,'store','web','store'],
'amount':['$120.00','40','bad','80',None,'-10','200','60','50'],
'units':[2,1,1,4,2,1,5,3,1],
'status':['paid','paid','paid','cancelled','paid','refunded','paid','paid','paid'],
'updated':['2026-09-01','2026-09-01','2026-09-02','2026-09-03','2026-09-03','2026-09-04','2026-09-04','2026-09-05','2026-09-06']})
accounts=pd.DataFrame({'customer':list('abcde'),'tier':['gold','basic','gold','basic','gold']})
`;
const ads=base+`ads=pd.DataFrame({'campaign':['A','A','B','B','C','C'],
'day':pd.to_datetime(['2026-09-01','2026-09-02']*3),
'impressions':[100,900,200,800,0,100], 'clicks':[20,45,10,40,0,5],
'conversions':[2,9,1,3,0,1], 'spend':[20.,90.,20.,60.,0.,10.]})
`;
const logs=base+`logs=pd.DataFrame({'device':['b','a','a','b','a','b'],
'at':['2026-09-03','2026-09-01','2026-09-03','2026-09-01','2026-09-02','2026-09-02'],
'reading':[30.,10.,18.,20.,14.,np.nan]})
`;
const customer=base+`train=pd.DataFrame({'segment':['a','a','b','b','c','c'],
'income':[10.,30.,100.,np.nan,np.nan,np.nan]})
validation=pd.DataFrame({'segment':['a','b','c','new'],'income':[np.nan,np.nan,np.nan,np.nan]})
`;
const sql=retail+`import sqlite3
con=sqlite3.connect(':memory:')
transactions=pd.DataFrame({'id':[1,2,3,4,5], 'customer':['a','a','b','d','d'],
'amount':[10.,30.,20.,40.,40.], 'date':['2026-09-01','2026-09-03','2026-09-02','2026-09-01','2026-09-03']})
transactions.to_sql('transactions',con,index=False)
accounts.to_sql('accounts',con,index=False)
`;
function task(id,area,title,prompt,solution,checks,hint,setup,minutes=6){return {id,area,title,prompt,solution,checks,hint,setup,minutes,type:'code'};}
function frame(id,area,title,prompt,solution,hint,setup,minutes=6){const q=task(id,area,title,prompt,solution,["assert isinstance(result,pd.DataFrame)","assert list(result.columns)==list(expected.columns)","assert result.shape==expected.shape","pd.testing.assert_frame_equal(result.reset_index(drop=True),expected.reset_index(drop=True),check_dtype=False)"],hint,setup,minutes);q.reference=solution.replace(/\bresult\b/g,'expected');return q;}
function add(id,area,title,lines,examples,drills){const l={id,area,title,lines,example:examples[0].code,examples,drills,practice:true};lessons.push(l);return l;}
const ex=(title,explanation,code)=>({title,explanation,code});
const retailPack=add('practice-retail','Pandas','Retail: messy exports to reliable totals',[
'An output contract is the exact required columns, row order, data types, and treatment of missing values.',
'Dedupe before summing, clean before comparing, and state whether refunds or unknown amounts belong in the result.',
'Practice sequence: study the two examples, solve each drill, then rebuild the final task without looking.'
],[ex('Currency strings: invalid is not zero','Remove formatting, then convert. A failed conversion stays missing so you can choose a business rule explicitly.',`s=pd.Series(['$1,250.00',' 80 ','oops',None])
values=pd.to_numeric(s.str.replace(r'[$,]','',regex=True).str.strip(),errors='coerce')
print(values.tolist()) # [1250.0,80.0,nan,nan]
assert values.isna().sum()==2`),ex('Choose the latest record, not the biggest amount','Sort by update time before dropping duplicate business IDs. File order alone is not a reliable timestamp.',`x=pd.DataFrame({'id':[1,2,1],'value':[90,30,70],'updated':['2026-09-01','2026-09-01','2026-09-03']})
x['updated']=pd.to_datetime(x['updated'])
latest=x.sort_values('updated').drop_duplicates('id',keep='last').sort_values('id')
assert latest['value'].tolist()==[70,30]`)],[
task('r1','Cleaning','Parse the money','Set result to a numeric Series of sales.amount. Remove dollar signs and commas. Invalid and absent values must stay missing. Preserve all nine rows.',`result=pd.to_numeric(sales['amount'].str.replace(r'[$,]','',regex=True),errors='coerce')`,["assert len(result)==9","assert result.isna().sum()==2","assert result.dropna().tolist()==[120,40,80,-10,200,60,50]"],'Do not fill missing values yet.',retail,3),
frame('r2','Pandas','Latest record wins','Return result with order and amount (raw strings), one row per order. Choose the record with the latest updated timestamp, sort by order. Order 102 was corrected after the initial export.',`x=sales.assign(updated=pd.to_datetime(sales['updated']))
result=x.sort_values('updated').drop_duplicates('order',keep='last').sort_values('order')[['order','amount']]`,'Parse the timestamp; then sort, dedupe, select.',retail,4),
frame('r3','Pandas','Count purchases, not export rows','Finance wants customer, revenue, paid_orders for customers with at least one valid paid transaction. Keep the latest update per order. Parse currency, include only paid amounts >=0, and exclude unknown amounts. Sum revenue and count valid paid orders, sorted by customer.',`x=sales.sort_values('updated').drop_duplicates('order',keep='last').copy()
x['amount']=pd.to_numeric(x['amount'].str.replace(r'[$,]','',regex=True),errors='coerce')
x=x.loc[x['status'].eq('paid') & x['amount'].ge(0)]
result=x.groupby('customer',as_index=False).agg(revenue=('amount','sum'),paid_orders=('order','count')).sort_values('customer')`,'Filter before aggregating. A failed parse must not count as a valid order.',retail,7),
frame('r4','Pandas','Client-ready account summary','The account team also needs zero-purchase accounts. Apply the previous drill’s transaction rules, then return every account with columns customer, tier, revenue, paid_orders. Fill missing totals with 0 and make paid_orders integer. Sort revenue descending, customer ascending for ties. Validate that joining does not multiply accounts.',`x=sales.sort_values('updated').drop_duplicates('order',keep='last').copy()
x['amount']=pd.to_numeric(x['amount'].str.replace(r'[$,]','',regex=True),errors='coerce')
x=x.loc[x['status'].eq('paid') & x['amount'].ge(0)]
g=x.groupby('customer',as_index=False).agg(revenue=('amount','sum'),paid_orders=('order','count'))
result=accounts.merge(g,on='customer',how='left',validate='one_to_one')
result[['revenue','paid_orders']]=result[['revenue','paid_orders']].fillna(0)
result['paid_orders']=result['paid_orders'].astype(int)
result=result.sort_values(['revenue','customer'],ascending=[False,True])`,'Start the final left join from accounts, not transactions.',retail,10)
]);
add('practice-ads','Pandas','Ad campaigns: rates, reshaping, and top-N',[
'A rate is a numerator divided by a denominator. Combining groups usually requires summing both before dividing.',
'Mean daily conversion rate and total conversions divided by total clicks answer different questions.',
'Zero denominators, ties, and absent combinations are deliberate traps in these drills.'
],[ex('The mean-of-rates trap','A tiny day should not receive the same weight as a large day when measuring total click-through rate.',`clicks=np.array([10,90]); impressions=np.array([20,900])
print((clicks/impressions).mean()) # .30: average daily CTR
print(clicks.sum()/impressions.sum()) # .10869565: overall CTR`),ex('Stable top-N','Specify a tie-breaker before taking the top rows in each group. head keeps exactly N; rank can retain extra ties.',`x=pd.DataFrame({'team':['a','a','a','b'],'id':[3,1,2,4],'score':[8,8,7,9]})
out=x.sort_values(['team','score','id'],ascending=[True,False,True]).groupby('team',sort=False).head(2)
assert out['id'].tolist()==[1,3,4]`)],[
frame('ad1','Pandas','Weighted campaign rates','Return campaign, ctr, cvr, cpa in campaign order. ctr=total clicks/total impressions; cvr=total conversions/total clicks; cpa=total spend/total conversions. Use NaN for any zero denominator.',`g=ads.groupby('campaign',as_index=False)[['impressions','clicks','conversions','spend']].sum()
result=g[['campaign']].copy()
result['ctr']=g['clicks']/g['impressions'].replace(0,np.nan)
result['cvr']=g['conversions']/g['clicks'].replace(0,np.nan)
result['cpa']=g['spend']/g['conversions'].replace(0,np.nan)`,'Sum raw quantities before dividing; do not average row-level rates.',ads,6),
frame('ad2','Pandas','Best day per campaign','For each campaign, select the day with the most conversions, breaking ties by earliest day. Return campaign, day, conversions in campaign order.',`result=ads.sort_values(['campaign','conversions','day'],ascending=[True,False,True]).groupby('campaign',sort=False).head(1)[['campaign','day','conversions']]`,'Sort by all selection criteria, then take one row per group.',ads,5),
frame('ad3','Pandas','Daily spend matrix','Build result with day as a regular column, then columns A, B, C containing campaign spend. Sort day ascending, fill absent combinations with 0. Remove the columns axis name (result.columns.name=None).',`result=ads.pivot_table(index='day',columns='campaign',values='spend',aggfunc='sum',fill_value=0).reset_index().sort_values('day')
result.columns.name=None`,'pivot_table, reset_index, then clear the columns name.',ads,5),
frame('ad4','Pandas','Revenue share without losing rows','Return campaign, day, spend, spend_share in original ads row order. spend_share is each row’s spend divided by its campaign’s total spend; zero campaign totals produce 0.',`result=ads[['campaign','day','spend']].copy()
total=ads.groupby('campaign')['spend'].transform('sum')
result['spend_share']=(ads['spend']/total.replace(0,np.nan)).fillna(0)`,'transform broadcasts the group total back to original rows.',ads,5)
]);
add('practice-logs','Pandas','Sensor logs: time order and missing days',[
'Previous means previous within the entity after sorting by time, not previous in the CSV.',
'A row-based rolling window and a calendar-day window differ when observations are missing.',
'A lagged feature uses only earlier observations; including the current target in its own feature leaks the answer.'
],[ex('Sort and isolate each device','Without grouping, the last row of one device can become the previous observation for another.',`x=pd.DataFrame({'device':['b','a','a'],'day':[1,2,1],'value':[99,15,10]})
x=x.sort_values(['device','day'])
x['previous']=x.groupby('device')['value'].shift(1)
assert x['previous'].fillna(-1).tolist()==[-1,10,-1]`),ex('Missing day vs zero activity','reindex introduces dates that were absent. Filling with zero is a business assumption, appropriate for no-sales days only when coverage is complete.',`s=pd.Series([5,9],index=pd.to_datetime(['2026-09-01','2026-09-03']))
s=s.reindex(pd.date_range('2026-09-01','2026-09-03'),fill_value=0)
assert s.tolist()==[5,0,9]
assert s.rolling(2,min_periods=1).mean().tolist()==[5,2.5,4.5]`)],[
frame('t1','Pandas','Change since previous observation','Return device, at (datetime), reading, delta, ordered device then at. delta is reading minus the immediately previous reading for the same device. Preserve NaNs rather than skipping missing readings.',`result=logs.assign(at=pd.to_datetime(logs['at'])).sort_values(['device','at'])
result['delta']=result.groupby('device')['reading'].diff()`,'diff is calculated after sorting within device. Do not drop missing readings first.',logs,5),
frame('t2','Cleaning','Forward fill within device','Return device, at (datetime), reading, sorted device then at. Forward-fill missing readings only from earlier readings of that same device. Do not use future observations.',`result=logs.assign(at=pd.to_datetime(logs['at'])).sort_values(['device','at'])
result['reading']=result.groupby('device')['reading'].ffill()`,'Group-specific ffill prevents cross-device contamination.',logs,5),
frame('t3','Pandas','Historical feature, no current reading','Return device, at, previous_mean in device/time order. previous_mean is the average of up to two preceding readings for that device, excluding the current reading and ignoring NaNs. If no previous nonmissing reading exists, leave NaN.',`x=logs.assign(at=pd.to_datetime(logs['at'])).sort_values(['device','at'])
result=x[['device','at']].copy()
result['previous_mean']=x.groupby('device')['reading'].transform(lambda s:s.shift(1).rolling(2,min_periods=1).mean())`,'shift(1) before rolling excludes the current row.',logs,8),
frame('t4','Pandas','Aggregate the whole date range','Return day (datetime), total for every date from Sept 1 to Sept 5, 2026 inclusive. Sum known readings across devices for observed days and use 0 for days with no observations. Sort by day.',`s=logs.assign(at=pd.to_datetime(logs['at'])).groupby('at')['reading'].sum()
s=s.reindex(pd.date_range('2026-09-01','2026-09-05'),fill_value=0)
result=s.rename_axis('day').rename('total').reset_index()`,'Build the requested date range explicitly; existing rows alone do not define it.',logs,6)
]);
add('practice-cleaning','Cleaning','Preprocessing: the failure cases',[
'A learned statistic must come from training data. Validation and test use that frozen value, including for unseen categories.',
'A fallback is the rule for a group with no usable observations. Without it, group imputation can leave holes.',
'Correct preprocessing preserves row alignment, feature names, and the meaning of missingness.'
],[ex('Training median, frozen for later','Validation is not a second opportunity to estimate a median. Use train statistics even when the validation distribution looks different.',`train=pd.Series([10.,20.,np.nan]); val=pd.Series([1000.,np.nan])
median=train.median()
assert val.fillna(median).tolist()==[1000.,15.]`),ex('Unknown category is not a crash','OneHotEncoder can ignore unseen categories. The output has the same number and order of columns as training.',`from sklearn.preprocessing import OneHotEncoder
enc=OneHotEncoder(handle_unknown='ignore',sparse_output=False)
enc.fit(pd.DataFrame({'city':['NY','LA']}))
out=enc.transform(pd.DataFrame({'city':['NY','Boston']}))
assert out.shape==(2,2)
assert out[1].sum()==0`)],[
task('cl1','Cleaning','Group median with a fallback','Use training income medians by segment to fill validation.income. Segments with no known training incomes, including unseen segments, use the overall training median. Set result to the filled validation income Series.',`medians=train.groupby('segment')['income'].median()
fills=validation['segment'].map(medians).fillna(train['income'].median())
result=validation['income'].fillna(fills)`,["assert result.tolist()==[20,100,30,30]","assert result.index.equals(validation.index)"],'The overall median of known training incomes 10,30,100 is 30.',customer,6),
task('cl2','Cleaning','Do not clip with validation fences','train_values=[1,2,3,4,100], validation_values=[-20,3,200]. Estimate 1.5 IQR lower/upper fences only on train_values; set result to clipped validation_values as a Series.',`q1,q3=train_values.quantile([.25,.75]);spread=q3-q1
result=validation_values.clip(q1-1.5*spread,q3+1.5*spread)`,["assert result.tolist()==[-1,3,7]"],'Training quartiles are 2 and 4. Validation never changes the fences.',base+`train_values=pd.Series([1.,2.,3.,4.,100.])
validation_values=pd.Series([-20.,3.,200.])`,4),
task('cl3','Cleaning','Aligned one-hot features','Fit encoder (OneHotEncoder, dense output, ignore unknown categories) on train[["segment"]]. Set result to its transform of validation[["segment"]]. Do not fit on validation.',`from sklearn.preprocessing import OneHotEncoder
encoder=OneHotEncoder(handle_unknown='ignore',sparse_output=False).fit(train[['segment']])
result=encoder.transform(validation[['segment']])`,["assert result.shape==(4,3)","assert np.array_equal(result,np.array([[1,0,0],[0,1,0],[0,0,1],[0,0,0]]))","assert encoder.categories_[0].tolist()==['a','b','c']"],'fit once, transform later. Unknown categories produce all zeros.',customer,5),
task('cl4','Cleaning','Scale using training range','Fit scaler=MinMaxScaler on training values [[0.],[10.],[20.]]. Transform validation values [[10.],[30.]] into result. Do not clip output or refit. What happens outside the training range?',`from sklearn.preprocessing import MinMaxScaler
scaler=MinMaxScaler().fit(train_values)
result=scaler.transform(validation_values)`,["assert np.allclose(result,[[.5],[1.5]])","assert np.allclose(scaler.data_max_,[20])"],'MinMaxScaler does not guarantee unseen values remain in [0,1] unless clipping is enabled.',base+`train_values=np.array([[0.],[10.],[20.]])
validation_values=np.array([[10.],[30.]])`,4)
]);
const sqlPack=add('practice-sql','SQL','SQL: business questions through Python',[
'Keep every account with LEFT JOIN, and count a right-table identifier rather than COUNT(*) when unmatched rows should count as zero.',
'A predicate is a condition. A right-table predicate in WHERE can accidentally remove unmatched left rows.',
'Use SQLite through Python here. Practice the data logic in both SQL and pandas; SQL itself is not confirmed for your version.'
],[ex('COUNT(*) vs COUNT(right.id)','A LEFT JOIN creates a placeholder row for an unmatched account. Count the actual transaction ID to avoid calling that a purchase.',`import sqlite3
con=sqlite3.connect(':memory:')
pd.DataFrame({'customer':['a','b']}).to_sql('a',con,index=False)
pd.DataFrame({'id':[1],'customer':['a']}).to_sql('t',con,index=False)
r=pd.read_sql_query('SELECT a.customer, COUNT(t.id) AS n FROM a LEFT JOIN t ON a.customer=t.customer GROUP BY a.customer ORDER BY a.customer',con)
assert r['n'].tolist()==[1,0]`),ex('Filter dates without losing empty accounts','Apply the date condition in the join or an aggregated subquery when all accounts must survive.',`# SELECT a.customer, COALESCE(SUM(t.amount),0) AS total
# FROM accounts a LEFT JOIN transactions t
# ON a.customer=t.customer AND t.date >= '2026-09-02'
# GROUP BY a.customer ORDER BY a.customer
# Putting t.date in WHERE would remove accounts without qualifying rows.`)],[
task('sq1','SQL','Keep accounts with zero purchases','Set query to SQL returning customer and n_orders for every account, sorted customer. Unmatched accounts must have 0 orders.',`query='''SELECT a.customer, COUNT(t.id) AS n_orders FROM accounts a
LEFT JOIN transactions t ON a.customer=t.customer
GROUP BY a.customer ORDER BY a.customer'''`,["result=pd.read_sql_query(query,con)","assert list(result.columns)==['customer','n_orders']","assert result['customer'].tolist()==list('abcde')","assert result['n_orders'].tolist()==[2,1,0,2,0]"],'COUNT(t.id), not COUNT(*).',sql,5),
task('sq2','SQL','Recent revenue for everyone','Set query to SQL returning customer, revenue since Sept 2 inclusive. Keep all accounts and use 0 where there are no qualifying transactions. Sort customer.',`query='''SELECT a.customer, COALESCE(SUM(t.amount),0) AS revenue
FROM accounts a LEFT JOIN transactions t ON a.customer=t.customer AND t.date>='2026-09-02'
GROUP BY a.customer ORDER BY a.customer'''`,["result=pd.read_sql_query(query,con)","assert result['customer'].tolist()==list('abcde')","assert result['revenue'].tolist()==[30,20,0,40,0]"],'Put the date restriction in ON so empty accounts survive.',sql,6),
task('sq3','SQL','Rank including ties','Set query to SQL returning customer, id for all transactions tied for that customer’s largest amount. Sort customer then id. A customer can have more than one top transaction.',`query='''WITH ranked AS (SELECT *,RANK() OVER(PARTITION BY customer ORDER BY amount DESC) AS r FROM transactions)
SELECT customer,id FROM ranked WHERE r=1 ORDER BY customer,id'''`,["result=pd.read_sql_query(query,con)","assert result['customer'].tolist()==['a','b','d','d']","assert result['id'].tolist()==[2,3,4,5]"],'RANK preserves ties; ROW_NUMBER would keep only one.',sql,6),
task('sq4','SQL','Changes between orders','Set query to SQL returning id and delta (current amount minus previous amount within customer, ordered by date then id). First orders have NULL delta. Final result sorted by id.',`query='''SELECT id,amount-LAG(amount) OVER(PARTITION BY customer ORDER BY date,id) AS delta FROM transactions ORDER BY id'''`,["result=pd.read_sql_query(query,con)","assert result['id'].tolist()==[1,2,3,4,5]","assert result['delta'].fillna(-999).tolist()==[-999,20,-999,-999,0]"],'LAG is a window function, not an aggregate.',sql,6)
]);
const scores=base+`truth=np.array([1,0,1,0,1,0,0,0])
scores=np.array([.95,.85,.80,.60,.55,.45,.25,.10])
`;
add('practice-metrics','Modeling','Metrics: choose a threshold under constraints',[
'A false positive is an unnecessary alert; a false negative is a missed positive. Their costs depend on the business.',
'Average precision summarizes a precision-recall curve; it is not precision at a specific threshold.',
'A target metric alone is not enough: enforce minimum recall or alert volume so a model cannot win by almost never acting.'
],[ex('An alert policy changes the confusion matrix','A threshold of .7 keeps fewer alerts than .5. Calculate both kinds of error rather than reporting only the best-looking metric.',`from sklearn.metrics import confusion_matrix
truth=np.array([1,0,1,0]);scores=np.array([.9,.8,.6,.2])
assert confusion_matrix(truth,scores>=.5,labels=[0,1]).tolist()==[[1,1],[0,2]]
assert confusion_matrix(truth,scores>=.85,labels=[0,1]).tolist()==[[2,0],[1,1]]`),ex('The least expensive mistake profile','Expected cost is a business calculation, not a built-in universal metric.',`truth=np.array([1,0,1,0]);pred=np.array([1,1,0,0])
fp=((truth==0)&(pred==1)).sum();fn=((truth==1)&(pred==0)).sum()
cost=5*fp+40*fn
assert cost==45`)],[
task('me1','Modeling','Compute the complete report','At threshold .5, return result tuple (TN, FP, FN, TP, precision, recall, F1). Use truth and scores supplied.',`from sklearn.metrics import confusion_matrix,precision_score,recall_score,f1_score
p=scores>=.5
tn,fp,fn,tp=confusion_matrix(truth,p,labels=[0,1]).ravel()
result=(tn,fp,fn,tp,precision_score(truth,p),recall_score(truth,p),f1_score(truth,p))`,["assert np.allclose(result,[3,2,0,3,.6,1,.75])"],'There are five alerts and three actual positives.',scores,5),
task('me2','Modeling','Pick the lowest-cost threshold','From thresholds [.5,.7,.9], minimize 10*FP + 30*FN. Break cost ties by choosing the lower threshold. Return result tuple (threshold,cost).',`options=[]
for t in [.5,.7,.9]:
    p=scores>=t
    fp=((truth==0)&p).sum();fn=((truth==1)&(~p)).sum()
    options.append((10*fp+30*fn,t))
cost,threshold=min(options)
result=(threshold,cost)`,["assert np.allclose(result,[.5,20])"],'Count FP and FN for each candidate; sort cost first, threshold second.',scores,6),
task('me3','Modeling','No feasible threshold','Choose from [.5,.7,.9] with precision >= .95 AND recall >= .5. Set result to the feasible threshold with highest recall, tie-break lower threshold. If none qualify, set result=None; do not quietly relax the constraints.',`from sklearn.metrics import precision_score,recall_score
valid=[]
for t in [.5,.7,.9]:
    p=scores>=t
    precision=precision_score(truth,p,zero_division=0);recall=recall_score(truth,p)
    if p.sum()>0 and precision>=.95 and recall>=.5:valid.append((-recall,t))
result=min(valid)[1] if valid else None`,["assert result is None"],'At .9 precision is 1, but only one of three positives is detected.',scores,6),
task('me4','Modeling','Evaluate probability scores','Return result tuple (ROC-AUC, average precision), computed from truth and scores. Do not threshold the scores first.',`from sklearn.metrics import roc_auc_score,average_precision_score
result=(roc_auc_score(truth,scores),average_precision_score(truth,scores))`,["assert np.allclose(result,[.8,(1+2/3+3/5)/3])"],'Both functions take continuous positive-class scores.',scores,4)
]);
const modelPack=add('practice-models','Modeling','Modeling: runnable solutions under a clock',[
'A baseline tells you whether model complexity added anything. Train it before tuning a large search.',
'Keep preprocessing inside cross-validation so each validation fold remains unseen while its training fold is fitted.',
'These datasets are synthetic exercises. Target scores test the workflow; real assessment datasets and thresholds can differ.'
],[ex('Three roles, three datasets','Training learns parameters. Validation chooses a model or threshold. The final test estimates performance after choices are frozen.',`from sklearn.model_selection import train_test_split
X=np.arange(200).reshape(100,2);y=np.tile([0,1],50)
X_train,X_rest,y_train,y_rest=train_test_split(X,y,test_size=.4,stratify=y,random_state=42)
X_val,X_test,y_val,y_test=train_test_split(X_rest,y_rest,test_size=.5,stratify=y_rest,random_state=42)
assert (len(y_train),len(y_val),len(y_test))==(60,20,20)`),ex('Small search, correct boundary','A parameter grid is a small list of settings to compare. Put the scaler inside the searched pipeline, not before the split.',`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
pipe=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000))
search=GridSearchCV(pipe,{'logisticregression__C':[.1,1,10]},cv=3,scoring='f1',n_jobs=1)
# search.fit(X_train,y_train)
# X_test must not participate in this search.`)],[
task('mo1','Modeling','Establish the baseline','Fit baseline=DummyClassifier(strategy="most_frequent") on X_train/y_train. Set result to its validation accuracy and recall as a tuple. The positive label is 1.',`from sklearn.dummy import DummyClassifier
from sklearn.metrics import accuracy_score,recall_score
baseline=DummyClassifier(strategy='most_frequent').fit(X_train,y_train)
p=baseline.predict(X_val)
result=(accuracy_score(y_val,p),recall_score(y_val,p,zero_division=0))`,["assert np.allclose(result,[.7,0])"],'The split has 70% negatives. A high-looking accuracy may find no positives.',MODEL,5),
task('mo2','Modeling','Cross-validation with preprocessing','Set pipeline to StandardScaler followed by LogisticRegression(max_iter=1000). Set result to three cross-validation F1 scores on X_train/y_train using StratifiedKFold(n_splits=3,shuffle=True,random_state=42). Do not fit preprocessing outside the pipeline.',`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score,StratifiedKFold
pipeline=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000))
folds=StratifiedKFold(n_splits=3,shuffle=True,random_state=42)
result=cross_val_score(pipeline,X_train,y_train,cv=folds,scoring='f1',n_jobs=1)`,["assert np.asarray(result).shape==(3,)","assert np.all((np.asarray(result)>=0)&(np.asarray(result)<=1))","assert np.mean(result)>.8","from sklearn.pipeline import Pipeline\nassert isinstance(pipeline,Pipeline)"],'cross_val_score fits a fresh copy of the full pipeline in each fold.',MODEL,8),
task('mo3','Modeling','A small model search','Fit search=GridSearchCV on a StandardScaler + LogisticRegression pipeline. Search C values [.1,1,10] with 3-fold CV, scoring="f1". Fit only X_train/y_train. Set predictions to the selected model’s predictions on X_val.',`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
pipe=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000))
search=GridSearchCV(pipe,{'logisticregression__C':[.1,1,10]},cv=3,scoring='f1',n_jobs=1).fit(X_train,y_train)
predictions=search.predict(X_val)`,["assert len(predictions)==len(y_val)","assert len(search.cv_results_['params'])==3","assert search.scoring=='f1'","from sklearn.metrics import f1_score\nassert f1_score(y_val,predictions)>.8"],'Nested parameter names use step__parameter.',MODEL,10),
task('mo4','Modeling','Export in the required order','Fit a StandardScaler + LogisticRegression pipeline called model on X_train/y_train. Return result with exactly customer_id and churn_probability, using score_ids in their given order and positive-class probabilities on X_test. No sorting and no DataFrame index column.',`from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
model=make_pipeline(StandardScaler(),LogisticRegression(max_iter=1000)).fit(X_train,y_train)
result=pd.DataFrame({'customer_id':score_ids,'churn_probability':model.predict_proba(X_test)[:,1]})`,["assert list(result.columns)==['customer_id','churn_probability']","assert result['customer_id'].tolist()==score_ids.tolist()","assert result['churn_probability'].between(0,1).all()","assert np.allclose(result['churn_probability'],model.predict_proba(X_test)[:,1])"],'Order is part of correctness. Use positive-class probabilities, not predicted labels.',MODEL+"\nscore_ids=np.arange(5000,5000+len(X_test))[::-1]\n",8)
]);
add('practice-eda','EDA','EDA: evidence a client can use',[
'Compare both the value and the sample size: a spectacular rate from one observation is weak evidence.',
'A plot needs a clear unit of analysis: one row per customer, day, or transaction. Duplicates change what the plot means.',
'Write one factual sentence and one limitation. Automated checks can check calculations and labels, but your interpretation needs human review.'
],[ex('Use the right denominator','count excludes missing values while size counts rows. Report both when missingness may be informative.',`x=pd.DataFrame({'group':['a','a','b'],'value':[10,np.nan,30]})
r=x.groupby('group').agg(rows=('value','size'),known=('value','count'),mean=('value','mean'))
assert r.loc['a','rows']==2 and r.loc['a','known']==1`),ex('A readable group comparison','Axes should tell the reader what the bars mean without reading your code.',`import matplotlib.pyplot as plt
fig,ax=plt.subplots()
ax.bar(['A','B'],[.12,.08])
ax.set(xlabel='Campaign',ylabel='Conversion rate',title='Observed conversion rate')
# Insight: A has a higher observed conversion rate.
# Limitation: without sample sizes and comparable audiences, this does not establish that A is better.`)],[
frame('ed1','EDA','Missingness audit by channel','On raw sales, normalize channel with strip/lower, replace missing channel with unknown, and parse amount strings. Return channel, rows, missing_amount, missing_rate in channel order. Do not dedupe; this audit is of the received export.',`x=sales.copy()
x['channel']=x['channel'].str.strip().str.lower().fillna('unknown')
x['amount']=pd.to_numeric(x['amount'].str.replace(r'[$,]','',regex=True),errors='coerce')
x['missing']=x['amount'].isna()
result=x.groupby('channel',as_index=False).agg(rows=('order','size'),missing_amount=('missing','sum'))
result['missing_rate']=result['missing_amount']/result['rows']`,'Make the missing flag first, then sum and divide by total rows.',retail,6),
task('ed2','EDA','Plot total campaign conversions','Create fig, ax with a bar chart of total conversions by campaign in A,B,C order. Label x Campaign, y Conversions, title Campaign conversions. Set totals to the grouped Series used for the plot.',`import matplotlib.pyplot as plt
totals=ads.groupby('campaign')['conversions'].sum().sort_index()
fig,ax=plt.subplots()
ax.bar(totals.index,totals.values)
ax.set(xlabel='Campaign',ylabel='Conversions',title='Campaign conversions')`,["assert totals.tolist()==[11,4,1]","assert ax.get_xlabel()=='Campaign' and ax.get_ylabel()=='Conversions'","assert ax.get_title()=='Campaign conversions'","assert [p.get_height() for p in ax.patches]==[11,4,1]"],'Aggregate before plotting; don’t silently plot six daily rows as campaign totals.',ads,6)
]);
const probability=[
['pr1','At least one conversion','Four independent calls each convert with probability .2. Probability at least one converts? Decimal.',1-.8**4,'Complement rule: 1 − P(none) = 1 − .8^4 = .5904.'],
['pr2','Sampling without replacement','A box has 3 faulty and 7 good sensors. Draw 2 without replacement. Probability both are faulty? Decimal.',3/10*2/9,'The second probability changes: (3/10)(2/9)=1/15. Independence would be wrong here.'],
['pr3','Rare event, many false alarms','Fraud prevalence .005, sensitivity .8, false-positive rate .02. Probability fraud given an alert? Decimal.',.004/(.004+.0199),'True positive mass .005×.8=.004; false-positive mass .995×.02=.0199. Divide .004 by .0239.'],
['pr4','Expected campaign profit','Each of 100 independent calls converts with probability .1. Each conversion earns $30; each call costs $1. Expected net profit?',200,'Expected conversions = 100×.1=10. Revenue 10×30 minus cost 100 = $200.'],
['pr5','Binomial variance','A binomial variable has n=20 and p=.25. What is its variance?',3.75,'Variance is np(1−p)=20×.25×.75=3.75, not np=5 (the mean).'],
['pr6','Confidence interval margin','Sample mean 50, sample standard deviation 10, n=100. Using the normal approximation z=1.96, what is the 95% interval margin of error?',1.96,'Standard error=10/sqrt(100)=1. Margin=1.96×1=1.96.'],
['pr7','Independent intersection','P(A)=.4, P(B)=.3, and A,B are independent. P(A and B)?',.12,'Independence permits multiplication: .4×.3=.12.'],
['pr8','Union with overlap','P(A)=.4, P(B)=.3, P(A and B)=.1. P(A or B)?',.6,'Inclusion-exclusion: .4+.3−.1=.6.'],
['pr9','Exactly one of each type','Choose 2 people without order from 3 analysts and 2 engineers. Probability of one of each?',.6,'Favorable pairs=3×2=6. All pairs=C(5,2)=10. Probability=.6.'],
['pr10','Normal symmetry','A continuous normal variable has mean 100 and standard deviation 15. Probability it is greater than 100?',.5,'A normal distribution is symmetric about its mean; half the probability lies on either side.'],
['pr11','Standard error scaling','Original standard error is 4. If independent sample size quadruples with the same population spread, what is the new standard error?',2,'Standard error decreases with sqrt(n); multiplying n by 4 divides it by 2.'],
['pr12','Expected value of a decision','An intervention prevents a $100 loss with probability .08 and always costs $5. Expected net benefit?',3,'Expected avoided loss=.08×100=$8; subtract $5 cost to get $3.']
].map(([id,title,prompt,answer,explanation])=>({id,area:'Probability',title,prompt,answer,explanation,type:'number',minutes:2}));
add('practice-probability','Probability','Probability: twelve short business problems',[
'Translate words into events before calculating. Write the denominator in plain English.',
'Use complements for at-least-one events, combinations when order does not matter, and Bayes for reversed conditions.',
'Solve by hand first. Then verify in a Python scratch cell; aim for two minutes per problem.'
],[ex('Bayes as a population table','A 90%-sensitive detector does not imply a 90% chance the alert is real.',`population=10000;prevalence=.02;sensitivity=.9;false_positive_rate=.05
true_positive=population*prevalence*sensitivity
false_positive=population*(1-prevalence)*false_positive_rate
posterior=true_positive/(true_positive+false_positive)
assert abs(posterior-180/670)<1e-12`),ex('At least one is easier through none','Independent trials let you multiply the probabilities of failures.',`p=.1;n=3
probability=1-(1-p)**n
assert abs(probability-.271)<1e-12`)],probability);
const concepts=[
['Duplicate join keys','A left table has 3 rows for customer A and the right table has 2 rows for A. An ordinary merge on customer produces how many matched rows for A?',['2','3','5','6'],[3],'Each left row matches each right row: 3×2=6. Validate key uniqueness before trusting sums.'],
['Unseen categories','Which is a suitable way to avoid failing on a new validation category?',['Fit an encoder separately on validation','OneHotEncoder(handle_unknown="ignore") fitted on training','Drop all validation rows','Use target labels to map categories'],[1],'Training defines the output columns; unseen categories can be encoded as zeros. Separate fitting can scramble column alignment.'],
['Choosing thresholds','Select ALL true statements.',['Choose thresholds on validation','A higher threshold guarantees higher observed precision at every step','Check recall and alert volume too','Use test labels repeatedly until the metric passes'],[0,2],'Finite-sample precision can fluctuate. Select with validation and freeze the policy before final testing.'],
['Validation contamination','Which actions can leak information? Select ALL.',['Imputing with full-dataset medians before splitting','Keeping scaling inside a cross-validation pipeline','Choosing features from full-dataset target correlations','Using next-month outcomes as current features'],[0,2,3],'Learned preprocessing, feature selection, and future outcomes must respect the training boundary.'],
['Averaging metrics','For rare fraud, macro-averaged F1 gives…',['Every sample equal class weight','Each class equal weight in the final average','Only negatives any weight','The same value as accuracy always'],[1],'Macro averages per-class metrics equally. Weighted averages weight by class support; report the positive-class metric when that is the operational goal.'],
['Ranking vs calibration','A model ranks cases well but predicts .99 for events that occur only half the time. The concern is…',['Poor probability calibration','No ranking ability necessarily','Missing one-hot columns necessarily','Too many labels'],[0],'Calibration asks whether predicted probabilities match observed frequencies. Ranking metrics alone do not establish it.'],
['Small positive support','A policy alerts once and is correct. Select ALL sound conclusions.',['Observed precision is 1','Future precision is guaranteed to be 1','Recall and sample size are still needed','This must be the best policy'],[0,2],'One correct alert provides little evidence about future reliability and may miss most positives.'],
['Feature availability','For loan-default prediction at application time, which feature is unsafe?',['Income reported at application','Application loan amount','Number of collection calls made after default','Prior credit history'],[2],'Collection calls after default reveal future information unavailable when the prediction is made.'],
['Why stratify?','stratify=y in a random split primarily aims to…',['Preserve approximate class proportions','Remove duplicate customers','Prevent every kind of leakage','Optimize the threshold'],[0],'Stratification preserves proportions. Group or chronological constraints require a different splitting strategy.'],
['Same customer in both sets','Repeated transactions from a customer appear in train and validation. Deployment will be on entirely new customers. Prefer…',['A split by customer group','A random row split only','Fitting on validation','Dropping the target'],[0],'Keep customer groups separate to estimate performance on unseen customers. The split should mirror deployment.'],
['Missingness indicator','Why might a missing-income flag help?',['Missingness itself may carry information','It proves the missing income is zero','It eliminates all bias','It replaces validation'],[0],'Whether a value is missing may relate to the outcome or process. Validate that this signal remains available and appropriate at deployment.'],
['Mean of rates','Day 1: 1 purchase/2 visits. Day 2: 9 purchases/98 visits. Overall conversion rate?',['About 29.6%','10%','50%','9%'],[1],'Sum purchases and visits: (1+9)/(2+98)=.1. An unweighted average of daily rates answers a different question.'],
['Regression metric units','Which regression error is in the same units as the target? Select ALL.',['MAE','MSE','RMSE','R²'],[0,2],'MAE and RMSE have target units; MSE has squared units, and R² is unitless.'],
['Feature importance','High tree feature importance establishes…',['Causation','An association the fitted model uses, subject to importance-method limitations','No need to validate','That the feature is available at prediction time'],[1],'Importance describes the fitted model, not causal effect. Check leakage, correlated features, and held-out importance.'],
['Boosting','Which describes gradient boosting?',['Models are added sequentially to improve a loss','All models must be independent bootstrap fits','It requires neural-network activations','It cannot overfit'],[0],'Boosting adds learners sequentially; learning rate and depth help control complexity. Bagging is the resampled-model aggregation pattern.'],
['Activation derivatives','ReLU applied to x=-3 yields…',['-3','0','3','A probability distribution'],[1],'ReLU(x)=max(0,x). It is not a normalized probability function.'],
['PCA scaling','Why standardize before PCA when features have very different units?',['Large-scale features can dominate variance directions','PCA uses target labels','Standardizing always improves every model','PCA requires a binary target'],[0],'PCA uses variance. Unit scale can determine which directions appear most important.'],
['k-NN prediction','Increasing k in k-NN generally…',['Smooths predictions and can increase bias','Always improves every metric','Makes the model a random forest','Removes the need to scale'],[0],'More neighbors smooth local variation; too many can underfit. Choose k using validation.'],
['Significance vs value','A tiny improvement has p=.001 on a huge sample. Select ALL true statements.',['The effect may still be too small to matter commercially','The null is true with probability .001','Report effect size and uncertainty','Deployment is automatically justified'],[0,2],'Statistical significance is not business significance. Consider practical magnitude, costs, and uncertainty.'],
['Prediction file contract','A task requests probabilities for supplied test IDs. Select ALL necessary checks.',['Preserve test row order or explicit ID mapping','Verify probability column and output row count','Sort predictions independently from IDs','Confirm the positive-class column'],[0,1,3],'An accurate model with misaligned predictions gives incorrect outputs. Match the requested schema and class meaning.']
];
quiz.push(...concepts.map(([title,prompt,options,answer,explanation],i)=>({id:'apq'+i,area:'ML concepts',title,prompt,options,answer,explanation,type:'choice',minutes:1})));
// Independently calculated fixtures verify the reference transformations too.
const fixtures={
 r2:["assert result['order'].tolist()==list(range(101,109))", "assert result['amount'].fillna('MISSING').tolist()==['$120.00','50','bad','80','MISSING','-10','200','60']"],
 r3:["assert result['customer'].tolist()==['a','d']", "assert result['revenue'].tolist()==[170,260]", "assert result['paid_orders'].tolist()==[2,2]"],
 r4:["assert result['customer'].tolist()==['d','a','b','c','e']", "assert result['revenue'].tolist()==[260,170,0,0,0]", "assert result['paid_orders'].tolist()==[2,2,0,0,0]", "assert pd.api.types.is_integer_dtype(result['paid_orders'])"],
 ad1:["assert np.allclose(result['ctr'],[.065,.05,.05])", "assert np.allclose(result['cvr'],[11/65,.08,.2])", "assert np.allclose(result['cpa'],[10,20,10])"],
 ad2:["assert result['conversions'].tolist()==[9,3,1]", "assert (result['day']==pd.Timestamp('2026-09-02')).all()"],
 ad3:["assert result[['A','B','C']].values.tolist()==[[20,20,0],[90,60,10]]", "assert result.columns.name is None"],
 ad4:["assert np.allclose(result['spend_share'],[2/11,9/11,.25,.75,0,1])"],
 t1:["assert result['delta'].fillna(-999).tolist()==[-999,4,4,-999,-999,-999]"],
 t2:["assert result['reading'].tolist()==[10,14,18,20,20,30]"],
 t3:["assert result['previous_mean'].fillna(-999).tolist()==[-999,10,12,-999,20,20]"],
 t4:["assert result['total'].tolist()==[30,14,48,0,0]"],
 ed1:["assert result['channel'].tolist()==['store','unknown','web']", "assert result['rows'].tolist()==[4,1,4]", "assert result['missing_rate'].tolist()==[0,0,.5]"]
};
for(const l of lessons.filter(l=>l.practice))for(const q of l.drills)if(fixtures[q.id])q.checks.push(...fixtures[q.id]);

// Separate IDs keep timed scores from overwriting practice progress.
exams.push({id:'sprint-data',name:'Data-processing sprint',minutes:30,day:'2–4',tasks:[retailPack.drills[2],retailPack.drills[3],sqlPack.drills[1]].map(q=>({...q,id:'sprint-'+q.id}))});
exams.push({id:'sprint-model',name:'Model-workflow sprint',minutes:30,day:'4–6',tasks:[modelPack.drills[0],modelPack.drills[1],modelPack.drills[3]].map(q=>({...q,id:'sprint-'+q.id}))});
}
