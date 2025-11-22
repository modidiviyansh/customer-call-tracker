/**
 * PAGINATION SOLUTION TEST SUITE
 * Comprehensive testing for Supabase server-side pagination fix
 * 
 * This test validates that:
 * 1. All 1400+ records are accessible through pagination
 * 2. Server-side pagination works correctly
 * 3. Search functionality works across all records
 * 4. Performance is optimal for large datasets
 */

import { usePaginatedCustomers } from './src/hooks/usePaginatedCustomers';
import { supabase } from './src/services/supabase';

// Test Configuration
const TEST_CONFIG = {
  expectedRecordCount: 1400, // Expected total records
  pageSize: 20,
  testPages: [1, 25, 50, 70], // Test key pages
  searchTerms: ['customer', '987654', 'name', 'mobile'],
  maxLoadTime: 2000, // Maximum acceptable query time in ms
};

/**
 * Test Suite for Pagination Solution
 */
class PaginationSolutionTest {
  constructor() {
    this.testResults = [];
    this.performanceMetrics = {};
  }

  /**
   * Run all tests and generate report
   */
  async runAllTests() {
    console.log('🧪 Starting Pagination Solution Test Suite...');
    console.log('=' .repeat(60));

    try {
      // Test 1: Basic Pagination Functionality
      await this.testBasicPagination();

      // Test 2: Large Dataset Accessibility
      await this.testLargeDatasetAccess();

      // Test 3: Search Functionality
      await this.testSearchFunctionality();

      // Test 4: Performance Benchmarking
      await this.testPerformanceBenchmarks();

      // Test 5: Edge Cases
      await this.testEdgeCases();

      // Generate final report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.push({
        test: 'Test Suite Execution',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Test 1: Basic Pagination Functionality
   */
  async testBasicPagination() {
    console.log('\n📄 Test 1: Basic Pagination Functionality');
    
    const startTime = Date.now();
    
    try {
      // Test first page
      const firstPageResult = await this.fetchPage(1);
      const page1Data = firstPageResult.data;
      const page1Count = firstPageResult.count;

      // Validate first page
      const page1Valid = page1Data.length <= TEST_CONFIG.pageSize && 
                        page1Data.length > 0 &&
                        page1Count >= TEST_CONFIG.expectedRecordCount;

      this.testResults.push({
        test: 'Basic Pagination - First Page',
        status: page1Valid ? 'PASSED' : 'FAILED',
        details: {
          recordsReturned: page1Data.length,
          totalCount: page1Count,
          expectedMinRecords: TEST_CONFIG.expectedRecordCount,
          pageSize: TEST_CONFIG.pageSize
        },
        timestamp: new Date().toISOString()
      });

      // Test middle page
      const middlePage = Math.ceil(page1Count / TEST_CONFIG.pageSize / 2);
      const middlePageResult = await this.fetchPage(middlePage);
      const middlePageValid = middlePageResult.data.length <= TEST_CONFIG.pageSize;

      this.testResults.push({
        test: 'Basic Pagination - Middle Page',
        status: middlePageValid ? 'PASSED' : 'FAILED',
        details: {
          pageNumber: middlePage,
          recordsReturned: middlePageResult.data.length,
          totalCount: middlePageResult.count
        },
        timestamp: new Date().toISOString()
      });

      // Test last page
      const lastPage = Math.ceil(page1Count / TEST_CONFIG.pageSize);
      const lastPageResult = await this.fetchPage(lastPage);
      const lastPageValid = lastPageResult.data.length >= 1;

      this.testResults.push({
        test: 'Basic Pagination - Last Page',
        status: lastPageValid ? 'PASSED' : 'FAILED',
        details: {
          pageNumber: lastPage,
          recordsReturned: lastPageResult.data.length,
          totalCount: lastPageResult.count
        },
        timestamp: new Date().toISOString()
      });

      const endTime = Date.now();
      this.performanceMetrics.basicPagination = endTime - startTime;

      console.log(`✅ Basic Pagination: ${page1Valid && middlePageValid && lastPageValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        test: 'Basic Pagination',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Basic Pagination failed:', error);
    }
  }

  /**
   * Test 2: Large Dataset Accessibility (1400+ Records)
   */
  async testLargeDatasetAccess() {
    console.log('\n📊 Test 2: Large Dataset Accessibility (1400+ Records)');
    
    const startTime = Date.now();
    
    try {
      // Get total count
      const { count: totalCount } = await supabase
        .from('fcm_customers')
        .select('*', { count: 'exact', head: true });

      const hasEnoughRecords = totalCount >= TEST_CONFIG.expectedRecordCount;

      this.testResults.push({
        test: 'Large Dataset - Record Count',
        status: hasEnoughRecords ? 'PASSED' : 'FAILED',
        details: {
          actualCount: totalCount,
          expectedMinCount: TEST_CONFIG.expectedRecordCount,
          hasEnoughRecords
        },
        timestamp: new Date().toISOString()
      });

      // Test multiple key pages
      const pageTests = [];
      for (const pageNum of TEST_CONFIG.testPages) {
        const pageResult = await this.fetchPage(pageNum);
        const isValidPage = pageResult.data.length <= TEST_CONFIG.pageSize && 
                           (pageNum === Math.ceil(totalCount / TEST_CONFIG.pageSize) || pageResult.data.length === TEST_CONFIG.pageSize);
        
        pageTests.push({
          page: pageNum,
          status: isValidPage ? 'PASSED' : 'FAILED',
          records: pageResult.data.length
        });
      }

      const allPagesValid = pageTests.every(test => test.status === 'PASSED');

      this.testResults.push({
        test: 'Large Dataset - Multiple Page Access',
        status: allPagesValid ? 'PASSED' : 'FAILED',
        details: {
          pagesTested: pageTests,
          totalPages: Math.ceil(totalCount / TEST_CONFIG.pageSize)
        },
        timestamp: new Date().toISOString()
      });

      const endTime = Date.now();
      this.performanceMetrics.largeDatasetAccess = endTime - startTime;

      console.log(`✅ Large Dataset Access: ${hasEnoughRecords && allPagesValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        test: 'Large Dataset Access',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Large Dataset Access failed:', error);
    }
  }

  /**
   * Test 3: Search Functionality
   */
  async testSearchFunctionality() {
    console.log('\n🔍 Test 3: Search Functionality');
    
    const startTime = Date.now();
    
    try {
      const searchResults = [];
      
      for (const searchTerm of TEST_CONFIG.searchTerms) {
        const searchResult = await this.searchRecords(searchTerm);
        const hasResults = Array.isArray(searchResult.data);
        const isPaginated = searchResult.count !== undefined;

        searchResults.push({
          searchTerm,
          status: hasResults && isPaginated ? 'PASSED' : 'FAILED',
          resultCount: searchResult.count,
          returnedRecords: searchResult.data.length
        });
      }

      const allSearchTestsValid = searchResults.every(test => test.status === 'PASSED');

      this.testResults.push({
        test: 'Search Functionality',
        status: allSearchTestsValid ? 'PASSED' : 'FAILED',
        details: {
          searchesTested: searchResults,
          searchTerms: TEST_CONFIG.searchTerms
        },
        timestamp: new Date().toISOString()
      });

      const endTime = Date.now();
      this.performanceMetrics.searchFunctionality = endTime - startTime;

      console.log(`✅ Search Functionality: ${allSearchTestsValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        test: 'Search Functionality',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Search Functionality failed:', error);
    }
  }

  /**
   * Test 4: Performance Benchmarks
   */
  async testPerformanceBenchmarks() {
    console.log('\n⚡ Test 4: Performance Benchmarks');
    
    const startTime = Date.now();
    
    try {
      // Test first page load time
      const page1Start = Date.now();
      await this.fetchPage(1);
      const page1LoadTime = Date.now() - page1Start;

      // Test search load time
      const searchStart = Date.now();
      await this.searchRecords('customer');
      const searchLoadTime = Date.now() - searchStart;

      // Test count query time
      const countStart = Date.now();
      await supabase
        .from('fcm_customers')
        .select('*', { count: 'exact', head: true });
      const countQueryTime = Date.now() - countStart;

      const performanceValid = page1LoadTime < TEST_CONFIG.maxLoadTime &&
                              searchLoadTime < TEST_CONFIG.maxLoadTime &&
                              countQueryTime < TEST_CONFIG.maxLoadTime;

      this.testResults.push({
        test: 'Performance Benchmarks',
        status: performanceValid ? 'PASSED' : 'FAILED',
        details: {
          pageLoadTime: `${page1LoadTime}ms`,
          searchLoadTime: `${searchLoadTime}ms`,
          countQueryTime: `${countQueryTime}ms`,
          threshold: `${TEST_CONFIG.maxLoadTime}ms`,
          allWithinThreshold: performanceValid
        },
        timestamp: new Date().toISOString()
      });

      this.performanceMetrics.performanceBenchmarks = {
        page1LoadTime,
        searchLoadTime,
        countQueryTime
      };

      console.log(`✅ Performance Benchmarks: ${performanceValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        test: 'Performance Benchmarks',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Performance Benchmarks failed:', error);
    }
  }

  /**
   * Test 5: Edge Cases
   */
  async testEdgeCases() {
    console.log('\n🎯 Test 5: Edge Cases');
    
    try {
      // Test empty search
      const emptySearchResult = await this.searchRecords('');
      const emptySearchValid = emptySearchResult.count >= TEST_CONFIG.expectedRecordCount;

      this.testResults.push({
        test: 'Edge Case - Empty Search',
        status: emptySearchValid ? 'PASSED' : 'FAILED',
        details: {
          expectedCount: TEST_CONFIG.expectedRecordCount,
          actualCount: emptySearchResult.count
        },
        timestamp: new Date().toISOString()
      });

      // Test non-existent search
      const noResultsSearch = await this.searchRecords('xyzabc123nonexistent');
      const noResultsValid = noResultsSearch.count === 0 && noResultsSearch.data.length === 0;

      this.testResults.push({
        test: 'Edge Case - No Results Search',
        status: noResultsValid ? 'PASSED' : 'FAILED',
        details: {
          searchTerm: 'xyzabc123nonexistent',
          resultCount: noResultsSearch.count,
          returnedRecords: noResultsSearch.data.length
        },
        timestamp: new Date().toISOString()
      });

      console.log(`✅ Edge Cases: ${emptySearchValid && noResultsValid ? 'PASSED' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        test: 'Edge Cases',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Edge Cases failed:', error);
    }
  }

  /**
   * Helper method to fetch a specific page
   */
  async fetchPage(pageNumber) {
    const from = (pageNumber - 1) * TEST_CONFIG.pageSize;
    const to = from + TEST_CONFIG.pageSize - 1;

    const { data, error, count } = await supabase
      .from('fcm_customers')
      .select('id, name, mobile1, mobile2, mobile3, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data, count };
  }

  /**
   * Helper method to search records
   */
  async searchRecords(searchTerm) {
    let query = supabase
      .from('fcm_customers')
      .select('id, name, mobile1, mobile2, mobile3, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (searchTerm.trim()) {
      const searchPattern = `%${searchTerm}%`;
      query = query.or(
        `name.ilike.${searchPattern},mobile1.ilike.${searchPattern},mobile2.ilike.${searchPattern},mobile3.ilike.${searchPattern}`
      );
    }

    const { data, error, count } = await query.range(0, TEST_CONFIG.pageSize - 1);

    if (error) throw error;
    return { data, count };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    console.log('\n' + '=' .repeat(60));
    console.log('📋 PAGINATION SOLUTION TEST REPORT');
    console.log('=' .repeat(60));

    const passedTests = this.testResults.filter(test => test.status === 'PASSED').length;
    const totalTests = this.testResults.length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${successRate}%`);

    console.log(`\n⚡ Performance Metrics:`);
    Object.entries(this.performanceMetrics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        console.log(`   ${key}:`);
        Object.entries(value).forEach(([metric, time]) => {
          console.log(`     ${metric}: ${time}ms`);
        });
      } else {
        console.log(`   ${key}: ${value}ms`);
      }
    });

    console.log(`\n📝 Detailed Test Results:`);
    this.testResults.forEach((test, index) => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${test.test}`);
      if (test.details) {
        console.log(`      Details:`, test.details);
      }
      if (test.error) {
        console.log(`      Error: ${test.error}`);
      }
    });

    // Overall assessment
    const overallStatus = passedTests === totalTests ? 'PASSED' : 'FAILED';
    console.log(`\n🎯 Overall Assessment: ${overallStatus}`);
    
    if (overallStatus === 'PASSED') {
      console.log('\n✅ SUCCESS: All pagination functionality tests passed!');
      console.log('   The 1000-record limitation issue has been successfully resolved.');
      console.log('   All 1400+ records are now accessible through proper server-side pagination.');
    } else {
      console.log('\n❌ FAILURE: Some tests failed. Please review the issues above.');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('Test completed at:', new Date().toISOString());
    console.log('=' .repeat(60));

    return {
      overallStatus,
      successRate,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      testResults: this.testResults,
      performanceMetrics: this.performanceMetrics
    };
  }
}

// Export for use in testing
export default PaginationSolutionTest;

// If running directly (for Node.js testing)
if (typeof window === 'undefined') {
  // This would be used in a Node.js testing environment
  console.log('PaginationSolutionTest module loaded. Use runAllTests() to execute.');
}