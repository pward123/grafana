import { css } from '@emotion/css';
import classNames from 'classnames';
import React, { FC, RefCallback, useCallback, useEffect, useRef } from 'react';
import Scrollbars, { positionValues } from 'react-custom-scrollbars-2';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '../../themes';

export type ScrollbarPosition = positionValues;

interface Props {
  className?: string;
  testId?: string;
  autoHide?: boolean;
  autoHideTimeout?: number;
  autoHeightMax?: string;
  hideTracksWhenNotNeeded?: boolean;
  hideHorizontalTrack?: boolean;
  hideVerticalTrack?: boolean;
  scrollRefCallback?: RefCallback<HTMLDivElement>;
  scrollTop?: number;
  setScrollTop?: (position: ScrollbarPosition) => void;
  autoHeightMin?: number | string;
  updateAfterMountMs?: number;
  onScroll?: React.UIEventHandler;
}

/**
 * Wraps component into <Scrollbars> component from `react-custom-scrollbars`
 */
export const CustomScrollbar: FC<Props> = ({
  autoHide = false,
  autoHideTimeout = 200,
  setScrollTop,
  className,
  testId,
  autoHeightMin = '0',
  autoHeightMax = '100%',
  hideTracksWhenNotNeeded = false,
  hideHorizontalTrack,
  hideVerticalTrack,
  scrollRefCallback,
  updateAfterMountMs,
  scrollTop,
  onScroll,
  children,
}) => {
  const ref = useRef<Scrollbars & { view: HTMLDivElement }>(null);
  const styles = useStyles2(getStyles);

  useEffect(() => {
    if (ref.current && scrollRefCallback) {
      scrollRefCallback(ref.current.view);
    }
  }, [ref, scrollRefCallback]);

  useEffect(() => {
    if (ref.current && scrollTop != null) {
      ref.current.scrollTop(scrollTop);
    }
  }, [scrollTop]);

  /**
   * Special logic for doing a update a few milliseconds after mount to check for
   * updated height due to dynamic content
   */
  useEffect(() => {
    if (!updateAfterMountMs) {
      return;
    }
    setTimeout(() => {
      const scrollbar = ref.current as any;
      if (scrollbar?.update) {
        scrollbar.update();
      }
    }, updateAfterMountMs);
  }, [updateAfterMountMs]);

  function renderTrack(className: string, hideTrack: boolean | undefined, passedProps: any) {
    if (passedProps.style && hideTrack) {
      passedProps.style.display = 'none';
    }

    return <div {...passedProps} className={className} />;
  }

  const renderTrackHorizontal = useCallback(
    (passedProps: any) => {
      return renderTrack('track-horizontal', hideHorizontalTrack, passedProps);
    },
    [hideHorizontalTrack]
  );

  const renderTrackVertical = useCallback(
    (passedProps: any) => {
      return renderTrack('track-vertical', hideVerticalTrack, passedProps);
    },
    [hideVerticalTrack]
  );

  const renderThumbHorizontal = useCallback((passedProps: any) => {
    return <div {...passedProps} className="thumb-horizontal" />;
  }, []);

  const renderThumbVertical = useCallback((passedProps: any) => {
    return <div {...passedProps} className="thumb-vertical" />;
  }, []);

  const renderView = useCallback((passedProps: any) => {
    return <div {...passedProps} className="scrollbar-view" />;
  }, []);

  const onScrollStop = useCallback(() => {
    ref.current && setScrollTop && setScrollTop(ref.current.getValues());
  }, [setScrollTop]);

  return (
    <Scrollbars
      data-testid={testId}
      ref={ref}
      className={classNames(styles.customScrollbar, className)}
      onScrollStop={onScrollStop}
      autoHeight={true}
      autoHide={autoHide}
      autoHideTimeout={autoHideTimeout}
      hideTracksWhenNotNeeded={hideTracksWhenNotNeeded}
      // These autoHeightMin & autoHeightMax options affect firefox and chrome differently.
      // Before these where set to inherit but that caused problems with cut of legends in firefox
      autoHeightMax={autoHeightMax}
      autoHeightMin={autoHeightMin}
      renderTrackHorizontal={renderTrackHorizontal}
      renderTrackVertical={renderTrackVertical}
      renderThumbHorizontal={renderThumbHorizontal}
      renderThumbVertical={renderThumbVertical}
      renderView={renderView}
      onScroll={onScroll}
    >
      {children}
    </Scrollbars>
  );
};

export default CustomScrollbar;

const getStyles = (theme: GrafanaTheme2) => {
  return {
    customScrollbar: css`
      // Fix for Firefox. For some reason sometimes .view container gets a height of its content, but in order to
      // make scroll working it should fit outer container size (scroll appears only when inner container size is
      // greater than outer one).
      display: flex;
      flex-grow: 1;
      .scrollbar-view {
        display: flex;
        flex-grow: 1;
        flex-direction: column;
      }
      .track-vertical {
        border-radius: ${theme.shape.borderRadius(2)};
        width: ${theme.spacing(1)} !important;
        right: 0px;
        bottom: ${theme.spacing(0.25)};
        top: ${theme.spacing(0.25)};
      }
      .track-horizontal {
        border-radius: ${theme.shape.borderRadius(2)};
        height: ${theme.spacing(1)} !important;
        right: ${theme.spacing(0.25)};
        bottom: ${theme.spacing(0.25)};
        left: ${theme.spacing(0.25)};
      }
      .thumb-vertical {
        background: ${theme.colors.action.focus};
        border-radius: ${theme.shape.borderRadius(2)};
        opacity: 0;
      }
      .thumb-horizontal {
        background: ${theme.colors.action.focus};
        border-radius: ${theme.shape.borderRadius(2)};
        opacity: 0;
      }
      &:hover {
        .thumb-vertical,
        .thumb-horizontal {
          opacity: 1;
          transition: opacity 0.3s ease-in-out;
        }
      }
    `,
  };
};
