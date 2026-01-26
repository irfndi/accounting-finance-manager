package database

import (
	"strings"
)

// QueryBuilder provides SQL query building capabilities
type QueryBuilder struct {
	selectClause []string
	fromClause   string
	whereClause  []string
	joinClause   []string
	orderBy      string
	limit        *int
	offset       *int
	args         []interface{}
}

// NewQueryBuilder creates a new QueryBuilder instance
func NewQueryBuilder() *QueryBuilder {
	return &QueryBuilder{
		selectClause: []string{"*"},
		args:         make([]interface{}, 0),
	}
}

// Select specifies columns to retrieve
func (qb *QueryBuilder) Select(columns ...string) *QueryBuilder {
	qb.selectClause = columns
	return qb
}

// From specifies the table to query
func (qb *QueryBuilder) From(table string) *QueryBuilder {
	qb.fromClause = table
	return qb
}

// Where adds a WHERE condition
func (qb *QueryBuilder) Where(condition string, args ...interface{}) *QueryBuilder {
	qb.whereClause = append(qb.whereClause, condition)
	qb.args = append(qb.args, args...)
	return qb
}

// Join adds a JOIN clause
func (qb *QueryBuilder) Join(joinType string, table string, condition string) *QueryBuilder {
	qb.joinClause = append(qb.joinClause, strings.Join([]string{joinType, table, "ON", condition}, " "))
	return qb
}

// OrderBy adds ORDER BY clause
func (qb *QueryBuilder) OrderBy(column string, direction string) *QueryBuilder {
	qb.orderBy = strings.Join([]string{column, direction}, " ")
	return qb
}

// Limit adds LIMIT clause
func (qb *QueryBuilder) Limit(n int) *QueryBuilder {
	qb.limit = &n
	return qb
}

// Offset adds OFFSET clause
func (qb *QueryBuilder) Offset(n int) *QueryBuilder {
	qb.offset = &n
	return qb
}

// Build returns the complete SQL query and arguments
func (qb *QueryBuilder) Build() (string, []interface{}) {
	var query strings.Builder

	query.WriteString("SELECT ")
	query.WriteString(strings.Join(qb.selectClause, ", "))
	query.WriteString(" FROM ")
	query.WriteString(qb.fromClause)

	if len(qb.joinClause) > 0 {
		query.WriteString(" ")
		query.WriteString(strings.Join(qb.joinClause, " "))
	}

	if len(qb.whereClause) > 0 {
		query.WriteString(" WHERE ")
		query.WriteString(strings.Join(qb.whereClause, " AND "))
	}

	if qb.orderBy != "" {
		query.WriteString(" ORDER BY ")
		query.WriteString(qb.orderBy)
	}

	if qb.limit != nil {
		query.WriteString(" LIMIT ?")
		qb.args = append(qb.args, *qb.limit)
	}

	if qb.offset != nil {
		query.WriteString(" OFFSET ?")
		qb.args = append(qb.args, *qb.offset)
	}

	return query.String(), qb.args
}
