"""Helpers for assembling the spine-pattern SQL used by the stats services.

These do not hide the SQL — each service still writes its own CTE bodies and
final SELECT — they take over the error-prone bookkeeping: keeping filter
conditions paired with their params, and keeping the rendered placeholder
order in lock-step with the order of the SQL fragments.
"""
from src.backend.services.sql.spine import HOURS_CTE


class Filters:
    """Accumulates WHERE conditions together with the params they consume."""

    def __init__(self):
        self.conditions: list[str] = []
        self.params: list = []

    def add(self, condition: str, *params) -> None:
        self.conditions.append(condition)
        self.params.extend(params)

    @property
    def where_sql(self) -> str:
        return " AND ".join(self.conditions)


def spine_cte_sql(dims: list[str], from_sql: str = "FROM hours", where_sql: str = "") -> str:
    """Body of the spine CTE: bucket the hours calendar by `dims`, counting hours
    per bucket. Dims may carry an "AS alias" for the output name; GROUP BY uses
    the bare expression. With no dims the spine collapses to a single row."""
    select_cols = ", ".join([*dims, "COUNT(*) AS hours_count"])
    group = f"GROUP BY {', '.join(d.split(' AS ')[0] for d in dims)}" if dims else ""
    return f"SELECT {select_cols} {from_sql} {where_sql} {group}"


def dims_join_condition(dims: list[str], left_alias: str, right_alias: str) -> str:
    """Equi-join condition over `dims`; TRUE (a cross join) when there are none."""
    return " AND ".join(f"{left_alias}.{d} = {right_alias}.{d}" for d in dims) or "TRUE"


class SpineQueryBuilder:
    """Assembles a `WITH hours, <ctes...> <final select>` query.

    The hours CTE always comes first and consumes the [start, end) spine bounds;
    each subsequent CTE and the final SELECT register their params alongside
    their SQL, so render() returns placeholders in guaranteed matching order.
    """

    def __init__(self, spine_start, spine_end):
        self._ctes: list[tuple[str, str]] = []
        self._params: list = [spine_start, spine_end]
        self._final: str = ""

    def add_cte(self, name: str, body_sql: str, params=()) -> None:
        self._ctes.append((name, body_sql))
        self._params.extend(params)

    def final(self, sql: str, params=()) -> None:
        self._final = sql
        self._params.extend(params)

    def render(self) -> tuple[str, list]:
        ctes = ",\n".join([HOURS_CTE, *(f"{name} AS ({body})" for name, body in self._ctes)])
        return f"WITH {ctes}\n{self._final}", self._params
