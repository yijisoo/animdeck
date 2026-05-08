* # Choosing a Database {logo: animdeck}
  * SQL vs NoSQL vs NewSQL
  * Ji Soo Yi
* ## The Decision
* It depends on your access patterns
  * ++ **Relational (SQL)** -- structured data, complex queries, strong consistency
    * PostgreSQL, MySQL, SQLite
  * ++ **Document (NoSQL)** -- flexible schema, hierarchical data, horizontal scale
    * MongoDB, DynamoDB, Firestore
  * ++ **Column-family** -- write-heavy workloads, time-series, analytics
    * Cassandra, HBase
  * ++ **NewSQL** -- SQL semantics with distributed scale
    * CockroachDB, Spanner, TiDB
* |vs| SQL vs Document
  * **Relational**
  * Fixed schema, enforced at write time
  * Strong ACID guarantees
  * Powerful joins across tables
  * Scales vertically by default
  * ---
  * **Document**
  * Flexible schema, evolves per document
  * Eventual consistency (configurable)
  * Denormalize for read performance
  * Scales horizontally by default
* |split| When to Use Each
  * Use **SQL** when:
  * ++ You need ACID transactions
  * ++ Data has clear relational structure
  * ++ Query patterns are known upfront
  * ++ Team knows SQL well
  * ---
  * Use **Document** when:
  * ++ Schema evolves frequently
  * ++ Data is naturally hierarchical
  * ++ Read volume >> write volume
  * ++ You need horizontal scale from day 1
* ## Consistency Models
* The CAP Theorem
  * A distributed system can guarantee at most **two of three**:
  * ++ **Consistency** -- every read sees the latest write
  * ++ **Availability** -- every request gets a response
  * ++ **Partition tolerance** -- system survives network splits
  * Network partitions are unavoidable in distributed systems
  * You are always choosing between C and A during a partition
  * > "The CAP theorem doesn't say you have to choose two all the time, just during partitions." -- Martin Kleppmann
  * [1] Brewer, E. (2000). Towards Robust Distributed Systems. PODC Keynote.
* ## Practical Advice
* Start Here
  * ++ Use **PostgreSQL** for most new projects
    * JSONB column gives you document flexibility when needed
    * Row-level security, full-text search, strong ecosystem
  * ++ Add a cache (Redis) before scaling the database
    * Most read bottlenecks are solved by caching, not sharding
  * ++ Only introduce NoSQL when SQL is genuinely the constraint
    * Not "SQL feels slow" -- profile first
  * ++ For time-series data, consider TimescaleDB (Postgres extension)
  * [1] https://www.postgresql.org/docs/current/
