# Database Performance Optimization Guide
## Supabase PostgreSQL Performance for Large-Scale Customer Data

---

## 🚀 PERFORMANCE OPTIMIZATION SUMMARY

### Issues Resolved:
- **1000-record limit**: Fixed with server-side pagination using proper OFFSET/LIMIT queries
- **Inaccurate pagination**: Implemented exact count queries with `{ count: 'exact' }`
- **Client-side search limitations**: Moved search filtering to server-side with ILIKE queries
- **Memory performance**: Eliminated client-side pagination of large datasets

### Performance Improvements:
- **Server-side pagination**: Only fetches required page data
- **Accurate counts**: Precise total count for correct pagination display
- **Optimized queries**: Efficient ORDER BY and LIMIT operations
- **Reduced memory usage**: Client processes only visible records

---

## 📊 DATABASE INDEXING RECOMMENDATIONS

### Current Optimized Indexes (Already Implemented)

```sql
-- Customer search indexes
CREATE INDEX idx_fcm_customers_name ON fcm_customers(name);
CREATE INDEX idx_fcm_customers_mobile1 ON fcm_customers(mobile1);
CREATE INDEX idx_fcm_customers_mobile2 ON fcm_customers(mobile2) WHERE mobile2 IS NOT NULL;
CREATE INDEX idx_fcm_customers_mobile3 ON fcm_customers(mobile3) WHERE mobile3 IS NOT NULL;
CREATE INDEX idx_fcm_customers_created_at ON fcm_customers(created_at);

-- Call logs performance indexes
CREATE INDEX idx_fcm_call_logs_customer_id ON fcm_call_logs(customer_id);
CREATE INDEX idx_fcm_call_logs_agent_pin ON fcm_call_logs(agent_pin);
CREATE INDEX idx_fcm_call_logs_call_date ON fcm_call_logs(call_date);
CREATE INDEX idx_fcm_call_logs_next_call_date ON fcm_call_logs(next_call_date);

-- Composite indexes for common query patterns
CREATE INDEX idx_fcm_call_logs_pin_date ON fcm_call_logs(agent_pin, call_date DESC);
CREATE INDEX idx_fcm_call_logs_customer_date ON fcm_call_logs(customer_id, call_date DESC);
CREATE INDEX idx_fcm_call_logs_next_reminders ON fcm_call_logs(agent_pin, next_call_date) WHERE next_call_date IS NOT NULL;
```

### Additional Performance Indexes (Recommended)

```sql
-- Search performance indexes for large datasets
CREATE INDEX idx_fcm_customers_name_gin ON fcm_customers USING gin(to_tsvector('english', name));
CREATE INDEX idx_fcm_customers_mobile_search ON fcm_customers(mobile1, mobile2, mobile3);

-- Pagination performance indexes
CREATE INDEX idx_fcm_customers_pagination ON fcm_customers(created_at DESC, id);

-- Partial indexes for filtered queries
CREATE INDEX idx_fcm_customers_active ON fcm_customers(created_at DESC) WHERE mobile1 IS NOT NULL;

-- JSONB indexes for address searches
CREATE INDEX idx_fcm_customers_address_gin ON fcm_customers USING gin(address_details);
```

---

## 🔧 QUERY OPTIMIZATION STRATEGIES

### 1. Server-Side Pagination Implementation

**Before (Problematic)**:
```javascript
// Only fetches first 1500 records
const { data } = await supabase
  .from('fcm_customers')
  .select('*')
  .limit(1500);

// Client-side pagination (limited data)
const paginatedData = data.slice(startIndex, endIndex);
```

**After (Optimized)**:
```javascript
// Server-side pagination with exact counts
let query = supabase
  .from('fcm_customers')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false });

// Apply search filter server-side
if (searchQuery) {
  query = query.or(`name.ilike.%${searchQuery}%,mobile1.ilike.%${searchQuery}%`);
}

// Server-side pagination
const from = (currentPage - 1) * pageSize;
const to = from + pageSize - 1;
query = query.range(from, to);

const { data, error, count } = await query;
```

### 2. Efficient Search Implementation

```sql
-- Optimized search with proper indexing
SELECT id, name, mobile1, mobile2, mobile3, address_details, created_at, updated_at
FROM fcm_customers
WHERE 
  name ILIKE '%searchterm%' OR 
  mobile1 ILIKE '%searchterm%' OR 
  mobile2 ILIKE '%searchterm%' OR 
  mobile3 ILIKE '%searchterm%'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- Count query for accurate pagination
SELECT COUNT(*)
FROM fcm_customers
WHERE 
  name ILIKE '%searchterm%' OR 
  mobile1 ILIKE '%searchterm%' OR 
  mobile2 ILIKE '%searchterm%' OR 
  mobile3 ILIKE '%searchterm%';
```

---

## 📈 PERFORMANCE MONITORING

### Database Performance Metrics

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check slow queries (requires pg_stat_statements extension)
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  stddev_time
FROM pg_stat_statements 
WHERE query LIKE '%fcm_customers%'
ORDER BY total_time DESC;
```

### Application-Level Performance Monitoring

```javascript
// Performance logging for pagination queries
const performanceLog = {
  queryType: 'paginated_customers',
  page: currentPage,
  pageSize: pageSize,
  totalCount: totalCount,
  queryTime: performance.now() - startTime,
  searchQuery: debouncedSearchQuery,
  timestamp: new Date().toISOString()
};

console.log('📊 Pagination Performance:', performanceLog);
```

---

## 🗄️ DATABASE MAINTENANCE

### Regular Maintenance Tasks

```sql
-- Analyze table statistics for query optimization
ANALYZE fcm_customers;
ANALYZE fcm_call_logs;

-- Vacuum tables to reclaim space
VACUUM fcm_customers;
VACUUM fcm_call_logs;

-- Reindex for optimal performance
REINDEX INDEX idx_fcm_customers_name;
REINDEX INDEX idx_fcm_customers_mobile1;
REINDEX INDEX idx_fcm_customers_created_at;
```

### Scaling Considerations

1. **Connection Pooling**: Configure Supabase connection limits
2. **Read Replicas**: For read-heavy workloads
3. **Partitioning**: For very large tables (>1M records)
4. **Archiving**: Move old records to archive tables

---

## 🔍 PERFORMANCE TESTING METHODOLOGY

### Test Dataset Creation

```sql
-- Generate test data for performance testing
INSERT INTO fcm_customers (name, mobile1, mobile2, mobile3, address_details)
SELECT 
  'Customer ' || generate_series(1, 1500),
  '987654' || lpad((generate_series(1, 1500))::text, 4, '0'),
  CASE WHEN generate_series(1, 1500) % 3 = 0 
    THEN '987654' || lpad((generate_series(1, 1500) + 1000)::text, 4, '0') 
    ELSE NULL 
  END,
  CASE WHEN generate_series(1, 1500) % 5 = 0 
    THEN '987654' || lpad((generate_series(1, 1500) + 2000)::text, 4, '0') 
    ELSE NULL 
  END,
  jsonb_build_object(
    'street', 'Street ' || generate_series(1, 1500),
    'city', 'City ' || (generate_series(1, 1500) % 50 + 1),
    'state', 'State ' || (generate_series(1, 1500) % 10 + 1),
    'zipCode', lpad((generate_series(1, 1500))::text, 6, '0')
  )
FROM generate_series(1, 1500);
```

### Performance Test Cases

1. **Pagination Performance**:
   - Test with 1000+ records
   - Measure query response times
   - Verify accurate counts
   - Test across different page numbers

2. **Search Performance**:
   - Test search with no results
   - Test search with many results
   - Test search with special characters
   - Measure search response times

3. **Concurrent User Testing**:
   - Test with multiple simultaneous users
   - Monitor database connection usage
   - Check for deadlocks or blocking

---

## 💾 CACHING STRATEGIES

### Client-Side Caching

```javascript
// Cache customer data for better UX
const useCustomerCache = () => {
  const [cache, setCache] = useState(new Map());
  
  const getCachedData = useCallback((key) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) { // 5 min cache
      return cached.data;
    }
    return null;
  }, [cache]);
  
  const setCachedData = useCallback((key, data) => {
    setCache(prev => new Map(prev).set(key, {
      data,
      timestamp: Date.now()
    }));
  }, []);
  
  return { getCachedData, setCachedData };
};
```

### Database-Level Caching

```sql
-- Create materialized view for frequently accessed data
CREATE MATERIALIZED VIEW customer_summary AS
SELECT 
  id,
  name,
  mobile1,
  created_at
FROM fcm_customers
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';

-- Create index on materialized view
CREATE INDEX idx_customer_summary_created_at ON customer_summary(created_at);

-- Refresh materialized view periodically
CREATE OR REPLACE FUNCTION refresh_customer_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW customer_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-customer-summary', '0 */6 * * *', 'SELECT refresh_customer_summary();');
```

---

## 🚨 MONITORING AND ALERTING

### Database Health Monitoring

```javascript
// Database performance monitoring
class DatabaseMonitor {
  constructor() {
    this.metrics = {
      queryTimes: [],
      errorCounts: new Map(),
      connectionCount: 0
    };
  }
  
  recordQueryTime(queryType, time) {
    this.metrics.queryTimes.push({
      queryType,
      time,
      timestamp: Date.now()
    });
    
    // Alert if average query time exceeds threshold
    const avgTime = this.getAverageQueryTime(queryType);
    if (avgTime > 1000) { // 1 second threshold
      console.warn(`⚠️ Slow query detected: ${queryType} averaged ${avgTime}ms`);
    }
  }
  
  recordError(queryType, error) {
    const count = this.metrics.errorCounts.get(queryType) || 0;
    this.metrics.errorCounts.set(queryType, count + 1);
    
    // Alert if error rate is too high
    if (count > 10) {
      console.error(`🚨 High error rate detected: ${queryType} has ${count} errors`);
    }
  }
  
  getAverageQueryTime(queryType) {
    const recentQueries = this.metrics.queryTimes
      .filter(q => q.queryType === queryType && Date.now() - q.timestamp < 60000)
      .map(q => q.time);
    
    return recentQueries.length > 0 
      ? recentQueries.reduce((a, b) => a + b, 0) / recentQueries.length 
      : 0;
  }
}

export const dbMonitor = new DatabaseMonitor();
```

---

## 📋 CHECKLIST FOR PRODUCTION DEPLOYMENT

### Pre-Deployment
- [ ] All indexes are created and optimized
- [ ] Server-side pagination is implemented
- [ ] Accurate count queries are working
- [ ] Search functionality is server-side
- [ ] Performance testing completed
- [ ] Monitoring and logging implemented

### Post-Deployment
- [ ] Monitor query performance metrics
- [ ] Verify all 1400+ records are accessible
- [ ] Test pagination across all pages
- [ ] Validate search accuracy
- [ ] Check database connection usage
- [ ] Monitor memory usage on client

### Long-term Maintenance
- [ ] Regular index maintenance
- [ ] Query performance monitoring
- [ ] Database growth monitoring
- [ ] Connection pool optimization
- [ ] Archive old data strategy

---

## 🔗 Related Documentation

- [Supabase Pagination Best Practices](https://supabase.com/docs/guides/database/pagination)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Client-Side vs Server-Side Pagination](https://supabase.com/docs/guides/database/pagination#server-side-pagination)

---

*Last Updated: 2025-11-22*
*Performance Optimization for Supabase Customer Data Management*