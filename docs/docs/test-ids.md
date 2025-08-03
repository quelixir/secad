# Standardized Test IDs

This document outlines the standardized IDs to use when creating Jest test files while developing for secad. These IDs follow the [Cuid2](https://github.com/paralleldrive/cuid2) format.

## Standard Test IDs

| Entity Type              | ID                         | Usage                                      |
| ------------------------ | -------------------------- | ------------------------------------------ |
| **Transaction**          | `ec83rv0fkh1zvqhs624zpcg4` | All transaction-related test data          |
| **Entity**               | `d5vaqv2ed5pb3gulopy9z5ao` | All entity-related test data               |
| **Security Class**       | `aziq1l0224y78j3vuwe9km2x` | All security class-related test data       |
| **Member (toMember)**    | `ge5qwju028wfh08e8ssvbyul` | The `toMember` in transaction test data    |
| **Member (fromMember)**  | `iics9wtcs2ysxhwn2v1aimx5` | The `fromMember` in transaction test data  |
| **Certificate Template** | `qvd5mb9xqn51v7liwvmczge7` | All certificate template-related test data |

## Usage Guidelines

### When to Use Standard IDs

- Unit tests, integration tests, error handling tests
- Mock data creation
- Error context objects

### When NOT to Use Standard IDs

- Test-specific edge cases requiring unique IDs
- Conflict testing scenarios
- Performance tests with large datasets

## Example

```typescript
describe("Certificate Generation", () => {
  const standardIds = {
    transactionId: "ec83rv0fkh1zvqhs624zpcg4",
    entityId: "d5vaqv2ed5pb3gulopy9z5ao",
    securityClassId: "aziq1l0224y78j3vuwe9km2x",
    toMemberId: "ge5qwju028wfh08e8ssvbyul",
    fromMemberId: "iics9wtcs2ysxhwn2v1aimx5",
    templateId: "qvd5mb9xqn51v7liwvmczge7",
  };

  it("should generate certificate with valid data", async () => {
    const mockTransaction = {
      id: standardIds.transactionId,
      entityId: standardIds.entityId,
      // ... other properties
    };
    // Test implementation
  });
});
```

## Benefits

- **Consistency**: Predictable test behavior
- **Debugging**: Easier issue tracking
- **Maintenance**: Reduced cognitive load
- **Documentation**: Clear reference for new tests

## Notes

- These IDs are for testing only, not production code
- Follow the project's ID generation pattern
- Add new entity types to this document when needed
