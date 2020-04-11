import React, { useState, useEffect, useCallback } from "react";
import { Pagination } from "@patternfly/react-core";
import { Table, TableHeader, TableBody, IRow, compoundExpand, IRowCell, ICell } from "@patternfly/react-table";
import { Link } from "react-router-dom";
import { IApplication } from "../../models/Application";
import DeploySubTable from "./DeploySubTable";
import { IEnvironment } from "../../config";

interface IProps {
  environments: IEnvironment[];
  applications: IApplication[];
}

const perPages = [10, 20, 50, 100];

export default (props: IProps) => {
  const { applications, environments } = props;
  const [rows, setRows] = useState<IRow[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(perPages[0]);

  const columns: ICell[] = [
    {
      title: "Path",
    },
  ].concat(environments.map((env) => ({ title: env.name, cellTransforms: [compoundExpand] })));

  const applicationsToRows = useCallback(
    (apps: IApplication[]) => {
      const allRows: IRow[] = [];
      apps.forEach((app, appIndex) => {
        // Setup Main Row
        const mainRow: IRow = {
          cells: [
            {
              title: <Link to={`/applications${app.path}`}>{app.path}</Link>,
              props: { component: "th" },
            },
          ],
        };

        const subRows: IRow[] = [];

        environments.forEach((env, envIndex) => {
          const appEnv = app.environments && app.environments.find((environment) => environment.name === env.name);

          const cell: ICell = {
            title: appEnv
              ? appEnv.deployHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].version
              : "",
            props: {
              isOpen: false,
            },
          };
          mainRow.cells?.push(cell);

          const subRow: IRow = {
            parent: appIndex * columns.length,
            compoundParent: envIndex + 1,
            cells: [
              {
                title: appEnv ? <DeploySubTable deployHistory={appEnv?.deployHistory} /> : "",
                props: { colSpan: 6, className: "pf-m-no-padding" },
              },
            ],
          };
          subRows.push(subRow);
        });

        allRows.push.apply(allRows, [mainRow].concat(subRows));
      });

      return allRows;
    },
    [columns.length, environments]
  );

  useEffect(() => {
    setRows(applicationsToRows(applications.slice(0, perPage)));
  }, [applicationsToRows, applications, perPage]);

  const onExpand = (event: any, rowIndex: number, colIndex: number, isOpen: boolean) => {
    if (!isOpen) {
      (rows[rowIndex].cells as IRowCell[]).forEach((cell) => {
        if (cell.props) cell.props.isOpen = false;
      });
      (rows[rowIndex].cells as IRowCell[])[colIndex].props.isOpen = true;
      rows[rowIndex].isOpen = true;
    } else {
      (rows[rowIndex].cells as IRowCell[])[colIndex].props.isOpen = false;
      rows[rowIndex].isOpen = (rows[rowIndex].cells as IRowCell[]).some((cell) => cell.props && cell.props.isOpen);
    }
    setRows([...rows]);
  };

  const handleSetPage = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPage: number,
    perPage?: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPage(newPage);
    setRows(applicationsToRows(applications.slice(startIdx, endIdx)));
  };

  const handlePerPageSelect = (
    _evt: React.MouseEvent | React.KeyboardEvent | MouseEvent,
    newPerPage: number,
    newPage: number,
    startIdx?: number,
    endIdx?: number
  ) => {
    setPerPage(newPage);
    setPage(newPage);
    setRows(applicationsToRows(applications.slice(startIdx, endIdx)));
  };

  const renderPagination = (variant = "bottom") => {
    return (
      <Pagination
        itemCount={applications.length}
        page={page}
        perPage={perPage}
        defaultToFullPage
        onSetPage={handleSetPage}
        onPerPageSelect={handlePerPageSelect}
        perPageOptions={perPages.map((p) => ({
          title: p.toString(),
          value: p,
        }))}
      />
    );
  };

  return (
    <>
      <Table cells={columns} rows={rows} onExpand={onExpand} aria-label="Application List">
        <TableHeader />
        <TableBody />
      </Table>
      {renderPagination()}
    </>
  );
};