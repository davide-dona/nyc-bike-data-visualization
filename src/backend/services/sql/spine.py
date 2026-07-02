# Calendar-based spine: one row per hour in [start, end), generated independently
# of any data table so that time buckets and hours_count never depend on the
# coverage of other tables. Takes two query params: start (inclusive) and end
# (exclusive). day_of_week matches the loaders' convention (0=Monday .. 6=Sunday).
HOURS_CTE = """hours AS (
            SELECT gs::date AS date,
                   EXTRACT(HOUR FROM gs)::smallint AS hour,
                   (EXTRACT(ISODOW FROM gs) - 1)::smallint AS day_of_week
            FROM generate_series(%s::timestamp, %s::timestamp - interval '1 hour', interval '1 hour') gs
        )"""
