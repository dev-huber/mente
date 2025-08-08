// Dependency Cruiser configuration for detecting architectural issues
module.exports = {
  forbidden: [
    // Circular dependencies
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise the architecture.',
      from: {},
      to: {
        circular: true
      }
    },
    
    // Orphaned modules
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'This is an orphan module - it is not used by any other module. Consider removing it.',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          'index\\.[jt]s$',
          'src/simple-server\\.ts$', // Entry points
          'src/dev-server\\.ts$',
          'test/.*\\.(spec|test)\\.[jt]s$'
        ]
      },
      to: {}
    },
    
    // Unreachable from entry points
    {
      name: 'no-unreachable-from-entry',
      severity: 'error',
      comment: 'This module is not reachable from any entry point. Consider removing it or adding it to an entry point.',
      from: {
        path: '^(src/(simple-server|dev-server)\\.ts)$'
      },
      to: {
        path: 'src',
        pathNot: [
          'node_modules',
          '\\.(spec|test)\\.(js|jsx|ts|tsx)$',
          '\\.d\\.ts$'
        ],
        reachable: false
      }
    },
    
    // Prevent importing test files
    {
      name: 'not-to-test',
      severity: 'error',
      comment: 'Do not import test files in production code',
      from: {
        pathNot: 'test/.*\\.(spec|test)\\.[jt]s$'
      },
      to: {
        path: 'test/.*\\.(spec|test)\\.[jt]s$'
      }
    },
    
    // Prevent utils from importing business logic
    {
      name: 'utils-independence',
      severity: 'error',
      comment: 'Utility modules should not depend on business logic',
      from: {
        path: 'src/utils'
      },
      to: {
        path: 'src/(services|functions)',
        pathNot: 'src/utils'
      }
    },
    
    // Services should not import functions
    {
      name: 'services-independence',
      severity: 'warn',
      comment: 'Services should not import Azure Functions - consider dependency injection',
      from: {
        path: 'src/services'
      },
      to: {
        path: 'src/functions'
      }
    }
  ],
  
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    includeOnly: {
      path: '^src|^test'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json'
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: {
            splines: 'ortho'
          }
        }
      }
    }
  }
};